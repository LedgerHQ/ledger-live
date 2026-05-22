import { contextBridge, ipcRenderer } from "electron";
import ethereumProvider from "@ledgerhq/ethereum-provider/lib/ethereum-provider.umd.json";

contextBridge.exposeInMainWorld("ElectronWebview", {
  postMessage: (message: unknown) => ipcRenderer.sendToHost("dappToParent", message),
});

// `${ethereumProvider.code}` is interpolated once here at preload eval time,
// producing a plain string that we then assign to `script.textContent`. Any
// backticks or `${...}` sequences that exist inside the bundled UMD source
// are therefore inert at this point — they only get re-tokenized as JS when
// the browser parses the injected <script>, where they're valid template
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

const injectEthereumProvider = () => {
  const parent = document.head || document.documentElement;

  if (!parent) {
    document.addEventListener("DOMContentLoaded", injectEthereumProvider, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.textContent = ethereumProviderInjection;

  // Inline <script> execution is synchronous on insertion into a parented
  // document, so by the time `appendChild` returns the provider has already
  // attached itself to the page's `window` and registered its load listener.
  // We can safely detach the node to keep the DOM clean.
  parent.appendChild(script);
  script.remove();
};

injectEthereumProvider();
