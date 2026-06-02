import { contextBridge, ipcRenderer, webFrame } from "electron";
import ethereumProvider from "@ledgerhq/ethereum-provider/lib/ethereum-provider.umd.json";

contextBridge.exposeInMainWorld("ElectronWebview", {
  postMessage: (message: unknown) => ipcRenderer.sendToHost("dappToParent", message),
});

// `${ethereumProvider.code}` is interpolated once here at preload eval time,
// producing a plain string that we then hand to `webFrame.executeJavaScript`.
// Any backticks or `${...}` sequences that exist inside the bundled UMD source
// are therefore inert at this point — they only get re-tokenized as JS when
// the page's main world evaluates the string, where they're valid template
// literals again. Do not refactor this into a concatenation that would let
// `${...}` be re-evaluated by the outer template.
const ethereumProviderInjection = `
${ethereumProvider.code}

if (document.readyState === "complete") {
  LedgerLiveEthereumProvider.onPageLoad();
} else {
  window.addEventListener("load", LedgerLiveEthereumProvider.onPageLoad, { once: true });
}
`;

// We evaluate the provider in the page's main world via `webFrame.executeJavaScript`
// rather than appending an inline <script> to the DOM. Embedder-evaluated code runs
// in the main world (so `window.ethereum` is visible to the dapp) but is NOT governed
// by the page's Content-Security-Policy, whereas an injected inline <script> is blocked
// by a restrictive `script-src`. The preload runs before the page's own scripts, so the
// provider is attached in time; no DOM node or readiness check is required.
webFrame.executeJavaScript(ethereumProviderInjection);
