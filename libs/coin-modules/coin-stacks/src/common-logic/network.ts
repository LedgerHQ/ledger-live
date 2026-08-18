import { StacksNetworks, type StacksNetworkName } from "@stacks/network";
import { getEnv } from "@ledgerhq/live-env";

function isStacksNetworkName(value: string): value is StacksNetworkName {
  return (StacksNetworks as readonly string[]).includes(value);
}

/**
 * Alpaca (CoinModuleApi) and the legacy bridge both select their network from `API_STACKS_NETWORK`
 * rather than a per-account field, so both read it fresh on every call, never cached at module
 * load -- a real user never sets this, only a devnet/testnet consumer (the coin-tester) does.
 */
export function getConfiguredStacksNetwork(): StacksNetworkName {
  const configured = getEnv("API_STACKS_NETWORK");
  return isStacksNetworkName(configured) ? configured : "mainnet";
}
