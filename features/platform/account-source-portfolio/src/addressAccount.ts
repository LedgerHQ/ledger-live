import type { PortfolioFamily } from "./family";

/** Our network to the service's, only where staging synchronizes an `account` registration. */
const ACCOUNT_NETWORKS: ReadonlyMap<string, string> = new Map([
  ["canton_network", "canton_network"],
  ["stellar", "stellar"],
  ["sui", "sui"],
  ["tezos", "tezos"],
  ["tron", "tron"],
]);

const SERVICE_NETWORKS: ReadonlySet<string> = new Set(ACCOUNT_NETWORKS.values());

/** One `account` registration per address, under an id of ours: `<service network>:<address>`, as the EVM fan-out names its accounts. */
export const addressAccountFamily: PortfolioFamily = {
  accountOf(descriptor) {
    const network = ACCOUNT_NETWORKS.get(descriptor.network);
    if (descriptor.type !== "address" || network === undefined) return undefined;
    const accountId = `${network}:${descriptor.address}`;
    return {
      registration: { type: "account", accountId, network, addresses: [descriptor.address] },
      serverAccountId: accountId,
    };
  },
  keyOf: ({ type, network, addresses }) =>
    type === "account" && network && SERVICE_NETWORKS.has(network) && addresses?.length === 1
      ? `account:${network}:${addresses[0]}`
      : undefined,
};
