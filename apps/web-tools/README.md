# Web Tools

**Production hosted at https://live.ledger.tools/**

The `web-tools` project is a web application that provides a set of tools to interact with Ledger Live ecosystem and test the ability of the stack to go web. It aim to be a developer web playground for any tools we need. By having this project running, we also ensure all our libraries are buildable for the web at any point in time.

Today we have:

- **Logs Viewer**: a tool to view logs exported from a Ledger Live application. This is useful for the customer support to investigate issues in collaboration with developers.
- **Ledger Live Desktop signatures**: this allows a user to verify if a Ledger Live Desktop build is legit but cross verifying the signature of the build with the public key of the Ledger Live Desktop team.
- **REPL**: this allows developers to test the connectivity on the web through various web implementation of HW Transports against our different hardware wallets. (U2F, WebHID, WebUSB, Web Bluetooth,...). This is a low level technical tool for developers where you can execute arbitrary APDUs.
- **Synchronisation**: this allows developers to test the coin implementations on the web. The page allows to take a Account ID and do a full synchronisation with the implementations. This helps revealing web specific issues like CORS or libraries that wouldn't be web compatible.
- **Network Troubleshooting**: allows to run basic HTTP check on some important API endpoints Ledger Live uses. This typically allows us to ask if a user can access our network from there location (e.g. through VPN / behind firewall / etc...)
- **Domain TLV Parser**: allows to parse a domain APDU (TLV) returned by the Ledger NFT Metadata service. This is useful to test the parsing done in the Ethereum app.
- **SVG Icons**: helper to facilitate the creation of currency SVG icons for the Ledger Live application. This will validate icons correctly matches Ledger Live expectations and will prefill a PR creation.
- **Derivation Paths**: Get a simple list of supported derivation paths for a given currency

---

This app uses Rspack for local development and production builds.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000/index.html](http://localhost:3000/index.html) with your browser to see the result.

Each tool is built as a dedicated HTML entry. Update the page under `pages/` and the corresponding entry in `src/entries/`.
