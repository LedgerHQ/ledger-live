# ethereum-provider

`@ledgerhq/ethereum-provider` implements an [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193)-compatible Ethereum provider backed by the Ledger Live Wallet API. It bridges dApps embedded in the Ledger Live webview (both Electron and React Native) to Ethereum accounts managed by the connected hardware wallet.

## What it does

- Implements the standard `window.ethereum` EIP-1193 provider interface via `postMessage` / `addEventListener`
- Routes JSON-RPC requests (`eth_requestAccounts`, `eth_sendTransaction`, `personal_sign`, etc.) through the Ledger Live host over the webview message bridge
- Handles both Electron (`ElectronWebview.postMessage`) and React Native (`ReactNativeWebView.postMessage`) transports
- Injects itself into the page via `onPageLoad` for use in Live Apps

## Key exports / concepts

- `LedgerLiveEthereumProvider` — the main EIP-1193 provider class; extends `EventEmitter`, handles request routing and response correlation
- `LedgerLiveEthereumProviderOptions` — construction options (targetOrigin, timeout, event source/target)
- `onPageLoad` — entry point to inject the provider into `window.ethereum` when the page loads

## Usage context

Used in the Ledger Live browser / Live Apps webview context. Consumed by dApps that need to call Ethereum RPC methods against the user's hardware wallet accounts without running a full node.
