/** Mirrors `PaymentConfigDto` on the backend. */
export interface PaymentConfigDto {
  /**
   * The shop's payout address, for showing where the money goes. The address a
   * given order is actually paid to comes from the order itself, which pins it
   * at checkout time.
   */
  walletAddress: string | null;
  /** EIP-155 chain id; the wallet is switched to this before signing. */
  chainId: number;
  currency: string;
  /** False when the shop has no wallet configured and cannot take payment. */
  enabled: boolean;
}

/** What checkout posts once the wallet has broadcast the transfer. */
export interface ConfirmPaymentDto {
  transactionHash: string;
}
