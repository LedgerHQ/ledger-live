import { LedgerLiveEthereumProvider } from "./LedgerLiveEthereumProvider";

// EthereumProvider injection
declare global {
  interface Window {
    ethereum: LedgerLiveEthereumProvider;
    web3: {
      currentProvider: LedgerLiveEthereumProvider;
    };
  }
}

export function onPageLoad() {
  const ethereumProvider = new LedgerLiveEthereumProvider();
  window.ethereum = ethereumProvider;

  // Metamask legacy compat (not sure we want to keep this)
  window.web3 = { currentProvider: ethereumProvider };

  const announceEip6963Provider = (provider: LedgerLiveEthereumProvider) => {
    const info = {
      uuid: "05146cb9-6ba2-4741-981c-f52f6033e8a2",
      name: "Ledger Live",
      icon: "https://play-lh.googleusercontent.com/mHjR3KaAMw3RGA15-t8gXNAy_Onr4ZYUQ07Z9fG2vd51IXO5rd7wtdqEWbNMPTgdqrk", // TODO update icon
      rdns: "com.ledger",
    };

    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: Object.freeze({ info, provider }),
      }),
    );
  };

  window.addEventListener("eip6963:requestProvider", () => {
    announceEip6963Provider(ethereumProvider);
  });

  announceEip6963Provider(ethereumProvider);

  window.dispatchEvent(new Event("ethereum#initialized"));
}
