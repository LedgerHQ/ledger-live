import { track } from "../analytics/segment";

const DISCOVER = "Account - Discover";
const RECEIVE = "Account - Receive";
const BALANCES = "Account - Balances";
const OPERATIONS = "Account - Operations";

export function trackDiscoveryStarted(p: { networks: string[]; device?: string }): void {
  track("discovery_started", {
    page: DISCOVER,
    networks: p.networks,
    device: p.device,
  });
}

export function trackDiscoveryCompleted(p: {
  networks: string[];
  accountsCount: number;
  device?: string;
}): void {
  track("discovery_completed", {
    page: DISCOVER,
    networks: p.networks,
    accountsCount: p.accountsCount,
    device: p.device,
  });
}

export function trackAddressResolved(p: { network: string; deviceRequired: boolean }): void {
  track("address_resolved", {
    page: RECEIVE,
    network: p.network,
    deviceRequired: p.deviceRequired,
  });
}

// Exception: balance_viewed / operation_viewed are kept as track events (not Page events) because they
// are in-context impressions rather than new screen loads. Documented exception to the *_viewed convention.
export function trackBalanceViewed(p: { network: string }): void {
  track("balance_viewed", {
    page: BALANCES,
    network: p.network,
  });
}

export function trackOperationViewed(p: {
  network: string;
  limit?: number;
  cursor?: string;
}): void {
  track("operation_viewed", {
    page: OPERATIONS,
    network: p.network,
    limit: p.limit,
    cursor: p.cursor,
  });
}
