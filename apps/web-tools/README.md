# Web Tools

**Production hosted at https://live.ledger.tools/**

The `web-tools` project is a web application that provides a set of tools to interact with Ledger Live ecosystem and test the ability of the stack to go web. It aim to be a developer web playground for any tools we need. By having this project running, we also ensure all our libraries are buildable for the web at any point in time.

Today we have:

- **Logs Viewer**: a tool to view logs exported from a Ledger Live application. This is useful for the customer support to investigate issues in collaboration with developers.
- **Ledger Live Desktop signatures**: this allows a user to verify if a Ledger Live Desktop build is legit but cross verifying the signature of the build with the public key of the Ledger Live Desktop team.
- **REPL**: this allows developers to test the connectivity on the web through various web implementation of HW Transports against our different hardware wallets. (U2F, WebHID, WebUSB, Web Bluetooth,...). This is a low level technical tool for developers where you can execute arbitrary APDUs.
- **Synchronisation**: this allows developers to test the coin implementations on the web. Give it an Account ID and it reads the balance through the account-data layer — showing which source answered (`granular` for a direct chain read, `full-sync` for a full `AccountBridge.sync()`) and every token balance that came back in the same call. A full legacy synchronisation stays one click away, to inspect everything else and to reveal web specific issues like CORS or libraries that wouldn't be web compatible.
- **Network Troubleshooting**: allows to run basic HTTP check on some important API endpoints Ledger Live uses. This typically allows us to ask if a user can access our network from there location (e.g. through VPN / behind firewall / etc...)
- **Domain TLV Parser**: allows to parse a domain APDU (TLV) returned by the Ledger NFT Metadata service. This is useful to test the parsing done in the Ethereum app.
- **SVG Icons**: helper to facilitate the creation of currency SVG icons for the Ledger Live application. This will validate icons correctly matches Ledger Live expectations and will prefill a PR creation.
- **Derivation Paths**: Get a simple list of supported derivation paths for a given currency

### Account data (hybrid balance reads)

`src/logic/accountData.ts` is this app's composition root for
[`@features/platform-account-data`](../../features/platform/account-data/README.md): it registers two
sources — `granular` (the coin module's own `getBalance`) and `full-sync` (today's
`AccountBridge.sync()`, projected onto balance rows). The highest-priority one that supports an
account answers.

Two places use it:

- **Synchronisation** reads a balance with `useAccountBalance`, and nothing else.
- **Ledger Sync** (`src/trustchain/`) used to resolve every incoming account descriptor with a
  **full** `bridge.sync()` — the whole operation history, the balance-history cache, the family
  resource bag — only to display a name and a balance. `descriptorToAccount` already rebuilds every
  other field with no network at all, so that sync was paid for one number.
  `src/logic/balanceOnlyBridge.ts` now answers the accounts cloud-sync module's `bridge.sync` call
  with a single balance read instead: one `getBalance` on a family with a granular coin module, the
  same full sync as before on families without one. Each row shows which source served it.

---

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
