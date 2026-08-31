# devops-shop
Frontend for the Shop application

## Running locally

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

Jest with Testing Library, driven through the pages the way an admin uses them.
The service layer is stubbed, so a test asserts what the app asks the backend
for, never how it is fetched. Runs on every pull request.

Two things in the test setup are worth knowing about:

- `next/navigation` is replaced by [`src/test-utils/nextNavigation.ts`](src/test-utils/nextNavigation.ts),
  since the real hooks need an App Router context that only exists inside a
  running Next server.
- `next-runtime-env` is replaced by [`src/test-utils/nextRuntimeEnv.tsx`](src/test-utils/nextRuntimeEnv.tsx).
  Its entry point re-exports a server component and pulls a large part of the
  Next server runtime into the test; the stub reproduces what the library
  actually does in a browser, which is one lookup in `window.__ENV`.

## Pages

| Path | Who | What |
| --- | --- | --- |
| `/` | everyone | Landing page and the catalogue |
| `/login`, `/register` | signed out | Sign in and self-registration |
| `/account` | signed in | Profile and wallet |
| `/basket` | customer | Review the basket and buy |
| `/orders` | customer | The customer's own orders |
| `/admin/articles` | admin | Add, restock, reprice and remove articles |
| `/admin/orders` | admin | Every order placed in this shop |

Pages are wrapped in `<RequireAuth role="…">`, and the navbar only offers what
the signed-in role can use — a basket for customers, "Manage shop" for the
owner. That is a UX guard, not a security boundary: the backend enforces the
same rules on the token, and every page calls endpoints that reject anyone else.

## The basket

The basket lives in the customer's own browser (`localStorage`, behind
[`basketStorage.ts`](src/lib/basketStorage.ts)) and only reaches the backend at
checkout. 

- An article that is out of stock cannot be added — the button says so and is
  disabled.
- Signing out clears the basket, since that can mean handing the browser to
  somebody else. An expired token does not: the customer signs back in and their
  basket is still there.

Checkout posts the article ids to the backend, reports the resulting order in an
`alert()`, then empties the basket. **Payment in crypto is not wired up yet**, so
the order comes back `PENDING` and the customer sees it on `/orders`.

## Configuration

The shop identity and the backend address are injected per deployment, so the
same image serves every shop created through ShopHub.

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Base URL of the shop backend |
| `NEXT_PUBLIC_SHOP_NAME` | `Shop` | Name shown in the navbar, hero and page title |
| `NEXT_PUBLIC_SHOP_TAGLINE` | generic tagline | Subtitle on the landing page |

Set these on the running container, not at build time.

Next.js substitutes `NEXT_PUBLIC_*` variables into the bundle during
`next build`. Since a single image serves every shop and the build has no shop
configured, that would freeze the defaults above into the JavaScript, and
variables set on the container would have no effect. The values are therefore
read per request through
[`next-runtime-env`](https://github.com/expatfile/next-runtime-env):
`<PublicEnvScript />` in the root layout sends the container's variables to the
browser with each response.

Two constraints follow from this:

- Read the values through `getShopName()`, `getShopTagline()` and
  `getApiBaseUrl()`, not `process.env.NEXT_PUBLIC_*`.
- Call those helpers inside a component. Module-level code is evaluated during
  the build, so a top-level `const` freezes the default again:

  ```ts
  const name = getShopName();          // evaluated once, at build time
  function NavBar() {
    const name = getShopName();        // evaluated per request
  }
  ```

All routes are consequently server-rendered on demand — `next build` reports `ƒ`
rather than `○` — since a pre-rendered page would contain one shop's values.
