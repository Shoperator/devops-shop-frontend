/**
 * The browser half of paying for an order.
 *
 * Talks to whatever EIP-1193 provider the visitor has installed — MetaMask in
 * practice — through `window.ethereum` directly. No wallet library: the shop
 * asks for an account, asks for a network, and asks for one plain value
 * transfer, and each of those is a single `request` call. A connector library
 * earns its weight when an app supports many wallets or many chains; this one
 * supports whichever wallet the customer already has.
 *
 * Nothing here is trusted by the shop. The hash this produces is checked
 * against the chain by the backend before an order is marked paid.
 */

/** The slice of EIP-1193 this app uses. */
interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

/** EIP-1193 rejection codes worth naming. */
const USER_REJECTED = 4001;
const UNRECOGNISED_CHAIN = 4902;

/** Wei per whole unit; EVM chains use 18 decimals for their native currency. */
const WEI_PER_ETHER = 10n ** 18n;

/**
 * Something the customer can act on: a wallet that is missing, a request they
 * declined, a network they have not added.
 */
export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletError";
  }
}

function provider(): EthereumProvider {
  if (typeof window === "undefined" || window.ethereum === undefined) {
    throw new WalletError(
      "No Web3 wallet found. Install MetaMask to pay for this order.",
    );
  }
  return window.ethereum;
}

/**
 * Whether a wallet is installed at all.
 *
 * The extension injects `window.ethereum` into the page, so this is an external
 * store rather than something render can read: on the server there is no
 * wallet, and React swaps in the real answer after hydration.
 */
export function isWalletAvailable(): boolean {
  return typeof window !== "undefined" && window.ethereum !== undefined;
}

/** What the server renders: no wallet, because there is no page yet. */
export function isWalletAvailableOnServer(): boolean {
  return false;
}

/**
 * The extension injects itself before the page is interactive and never takes
 * itself away again, so there is no change to listen for — the subscription
 * exists only because `useSyncExternalStore` asks for one.
 */
export function subscribeToWallet(): () => void {
  return () => {};
}

function errorCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const { code } = error as { code?: unknown };
  return typeof code === "number" ? code : null;
}

/**
 * The order's total as wei.
 *
 * `total` carries two decimals, so multiplying by 100 lands exactly on an
 * integer and the rest of the scaling happens in BigInt. This mirrors `toWei`
 * in the backend on purpose: the customer must be asked for exactly the amount
 * the shop will check for, and `amount * 1e18` in floating point is not that.
 */
export function toWei(amount: number): bigint {
  return (BigInt(Math.round(amount * 100)) * WEI_PER_ETHER) / 100n;
}

/** Asks the wallet to unlock and share an account. Returns the chosen address. */
export async function connect(): Promise<string> {
  try {
    const accounts = (await provider().request({
      method: "eth_requestAccounts",
    })) as string[];

    if (accounts.length === 0) {
      throw new WalletError("Your wallet did not share an account.");
    }
    return accounts[0];
  } catch (error) {
    if (errorCode(error) === USER_REJECTED) {
      throw new WalletError("You declined the connection request.");
    }
    throw error;
  }
}

/**
 * Puts the wallet on the chain this shop settles on.
 *
 * A wallet pointed at another network would happily sign a transfer that never
 * reaches the shop's chain, so this runs before every payment rather than once
 * at connect time — the customer can switch networks in the extension while the
 * page is open.
 *
 * An unknown chain is reported rather than added: adding one needs an RPC URL
 * the browser can reach, and the shop deliberately does not publish the address
 * its own backend uses, which inside the cluster is a Service name anyway.
 */
export async function ensureChain(chainId: number): Promise<void> {
  const hexChainId = `0x${chainId.toString(16)}`;

  try {
    await provider().request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
  } catch (error) {
    const code = errorCode(error);
    if (code === UNRECOGNISED_CHAIN) {
      throw new WalletError(
        `Add the network with chain id ${chainId} to your wallet, then try again.`,
      );
    }
    if (code === USER_REJECTED) {
      throw new WalletError("You declined the network switch.");
    }
    throw error;
  }
}

/**
 * Sends the payment and answers with the transaction hash.
 *
 * The hash comes back as soon as the wallet broadcasts, which is before the
 * transaction is mined — the backend is what waits for it to appear on chain.
 */
export async function sendPayment(options: {
  from: string;
  to: string;
  amount: number;
}): Promise<string> {
  const { from, to, amount } = options;

  try {
    return (await provider().request({
      method: "eth_sendTransaction",
      params: [
        {
          from,
          to,
          value: `0x${toWei(amount).toString(16)}`,
        },
      ],
    })) as string;
  } catch (error) {
    if (errorCode(error) === USER_REJECTED) {
      throw new WalletError("You rejected the payment in your wallet.");
    }
    throw error;
  }
}
