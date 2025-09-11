import { hydrate as evmHydrate, preload as evmPreload } from "@ledgerhq/coin-evm/bridge/preload";

export function getPreload(network: string) {
  switch (network) {
    case "evm":
      return evmPreload;
    default:
      return () => Promise.resolve({});
  }
}

export function getHydrate(network: string) {
  switch (network) {
    case "evm":
      return evmHydrate;
    default:
      return () => undefined;
  }
}
