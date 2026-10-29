import network from "@ledgerhq/live-network/network";
import type {
  ChainwatchNetwork,
  ChainwatchAccount,
  ChainwatchTargetType,
  ChainwatchMonitorType,
} from "@ledgerhq/types-live";

const hexAddressPattern = /^0x[0-9a-f]+$/i;

const addressRequestBatchSize = 100;

const addressRequestBatches = (addresses: readonly string[]) => {
  const batches: string[][] = [];
  for (let start = 0; start < addresses.length; start += addressRequestBatchSize) {
    batches.push(addresses.slice(start, start + addressRequestBatchSize));
  }
  return batches;
};

const isNotFoundError = (error: unknown) =>
  typeof error === "object" && error !== null && "status" in error && error.status === 404;

// Hex addresses match case-insensitively, other addresses exactly.
const tailKey = (address: string, length: number) => {
  const tail = address.slice(address.length - length);
  return hexAddressPattern.test(address) ? `hex:${tail.toLowerCase()}` : `exact:${tail}`;
};

const suffixKeys = (suffix: string) => [`hex:${suffix.toLowerCase()}`, `exact:${suffix}`];

const tailKeys = (addresses: string[], lengths: Set<number>) =>
  new Set(
    addresses.flatMap(address =>
      [...lengths]
        .filter(length => length <= address.length)
        .map(length => tailKey(address, length)),
    ),
  );

const makeSubscriptionMatcher = (suffixes: string[]) => {
  const lengths = new Set(suffixes.map(suffix => suffix.length));
  const keys = new Set(suffixes.flatMap(suffixKeys));
  return (address: string) =>
    Boolean(address) &&
    [...lengths].some(length => length <= address.length && keys.has(tailKey(address, length)));
};

class ChainwatchAccountManager {
  chainwatchBaseUrl: string;
  userId: string;
  network: ChainwatchNetwork;
  suffixes: string[];

  constructor(chainwatchBaseUrl: string, userId: string, chainwatchNetwork: ChainwatchNetwork) {
    this.chainwatchBaseUrl = chainwatchBaseUrl;
    this.userId = userId;
    this.network = chainwatchNetwork;
    this.suffixes = [];
  }

  async getChainwatchAccount(): Promise<ChainwatchAccount | undefined> {
    try {
      const { data } = await network({
        method: "GET",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/`,
      });
      return data;
    } catch (error: unknown) {
      if (isNotFoundError(error)) return;
      throw error;
    }
  }

  async removeChainwatchAccount() {
    try {
      await network({
        method: "DELETE",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/`,
      });
    } catch (error: unknown) {
      if (isNotFoundError(error)) return;
      throw error;
    }
  }

  async registerNewChainwatchAccount() {
    const { data } = await network({
      method: "PUT",
      url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/`,
    });
    return data;
  }

  accountAlreadySubscribed(address: string) {
    return makeSubscriptionMatcher(this.suffixes)(address);
  }

  async registerNewAddresses(addressesToRegister: string[]) {
    const isSubscribed = makeSubscriptionMatcher(this.suffixes);
    const addresses = addressesToRegister.filter(address => address && !isSubscribed(address));
    for (const batch of addressRequestBatches(addresses)) {
      await network({
        method: "PUT",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/addresses/`,
        data: batch,
      });
    }
  }

  async removeAddresses(addressesToRemove: string[]) {
    const isSubscribed = makeSubscriptionMatcher(this.suffixes);
    const addresses = addressesToRemove.filter(address => isSubscribed(address));
    for (const batch of addressRequestBatches(addresses)) {
      await network({
        method: "DELETE",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/addresses/`,
        data: batch,
      });
      const removedKeys = tailKeys(batch, new Set(this.suffixes.map(suffix => suffix.length)));
      this.suffixes = this.suffixes.filter(
        suffix => !suffixKeys(suffix).some(key => removedKeys.has(key)),
      );
    }
  }

  async registerNewMonitor(monitor: ChainwatchMonitorType) {
    await network({
      method: "PUT",
      url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/monitor/`,
      data: {
        confirmations: this.network.nbConfirmations,
        type: monitor,
      },
    });
  }

  async registerNewTarget(target: ChainwatchTargetType) {
    await network({
      method: "PUT",
      url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/target/`,
      data: {
        equipment: this.userId,
        type: target,
      },
    });
  }

  async loadChainwatchAccount() {
    const chainwatchAccount = await this.getChainwatchAccount();
    this.suffixes = chainwatchAccount?.suffixes || [];
    return chainwatchAccount;
  }

  async setupChainwatchAccount() {
    const chainwatchAccount =
      (await this.loadChainwatchAccount()) || (await this.registerNewChainwatchAccount());
    if (chainwatchAccount) {
      this.suffixes = chainwatchAccount?.suffixes || [];

      // Ensure both monitors use the configured confirmation count.
      if (
        !chainwatchAccount?.monitors?.find(
          monitor =>
            monitor.type === "send" && monitor.confirmations === this.network.nbConfirmations,
        )
      ) {
        await this.registerNewMonitor("send");
      }
      if (
        !chainwatchAccount?.monitors?.find(
          monitor =>
            monitor.type === "receive" && monitor.confirmations === this.network.nbConfirmations,
        )
      ) {
        await this.registerNewMonitor("receive");
      }

      // Set Chainwatch account's target (braze) if it doesn't exist yet
      if (!chainwatchAccount?.targets?.find(target => target.type === "braze")) {
        await this.registerNewTarget("braze");
      }
    }
  }
}

export default ChainwatchAccountManager;
