import ethereumProvider from "@ledgerhq/ethereum-provider/lib/ethereum-provider.umd.json";

export const INJECTED_JAVASCRIPT = `
${ethereumProvider.code}

window.addEventListener("load", LedgerLiveEthereumProvider.onPageLoad);

true; // note: this is required, or you'll sometimes get silent failures
`;
