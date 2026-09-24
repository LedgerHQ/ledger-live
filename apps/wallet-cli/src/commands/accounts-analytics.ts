import { track } from "../analytics/segment";

const DISCOVER = "Account - Discover";
const RECEIVE = "Account - Receive";
const BALANCES = "Account - Balances";
const OPERATIONS = "Account - Operations";

export async function trackDiscoveryStarted(p: {
  networks: string[];
  device?: string;
}): Promise<void> {
  await track("discovery_started", {
    page: DISCOVER,
    networks: p.networks,
    device: p.device,
  });
}

export async function trackDiscoveryCompleted(p: {
  networks: string[];
  accountsCount: number;
  device?: string;
}): Promise<void> {
  await track("discovery_completed", {
    page: DISCOVER,
    networks: p.networks,
    accountsCount: p.accountsCount,
    device: p.device,
  });
}

export async function trackAddressResolved(p: {
  network: string;
  deviceRequired: boolean;
}): Promise<void> {
  await track("address_resolved", {
    page: RECEIVE,
    network: p.network,
    deviceRequired: p.deviceRequired,
  });
}

// Exception: balance_viewed / operation_viewed are kept as track events (not Page events) because they
// are in-context impressions rather than new screen loads. Documented exception to the *_viewed convention.
export async function trackBalanceViewed(p: { network: string }): Promise<void> {
  await track("balance_viewed", {
    page: BALANCES,
    network: p.network,
  });
}

export async function trackOperationViewed(p: {
  network: string;
  limit?: number;
  cursor?: string;
}): Promise<void> {
  await track("operation_viewed", {
    page: OPERATIONS,
    network: p.network,
    limit: p.limit,
    cursor: p.cursor,
  });
}
