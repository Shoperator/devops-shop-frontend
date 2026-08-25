# devops-shop
Frontend for the Shop application

## Running locally

```bash
npm install
npm run dev
```

## Configuration

The shop identity and the backend address are injected per deployment, so the
same image serves every shop created through ShopHub.

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Base URL of the shop backend |
| `NEXT_PUBLIC_SHOP_NAME` | `Shop` | Name shown in the navbar, hero and page title |
| `NEXT_PUBLIC_SHOP_TAGLINE` | generic tagline | Subtitle on the landing page |
