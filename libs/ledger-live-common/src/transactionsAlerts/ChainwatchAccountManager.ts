import network from "@ledgerhq/live-network/network";
import type {
  ChainwatchNetwork,
  ChainwatchAccount,
  ChainwatchTargetType,
  ChainwatchMonitorType,
} from "@ledgerhq/types-live";

const hexAddressPattern = /^0x[0-9a-f]+$/i;

const isNotFoundError = (error: unknown) =>
  typeof error === "object" && error !== null && "status" in error && error.status === 404;

const addressMatchesSuffix = (address: string, suffix: string) =>
  hexAddressPattern.test(address)
    ? address.toLowerCase().endsWith(suffix.toLowerCase())
    : address.endsWith(suffix);

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
    if (!address) return false;
    return this.suffixes.some(suffix => addressMatchesSuffix(address, suffix));
  }

  async registerNewAddresses(addressesToRegister: string[]) {
    const addresses = addressesToRegister.filter(
      address => address && !this.accountAlreadySubscribed(address),
    );
    if (addresses.length > 0) {
      await network({
        method: "PUT",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/addresses/`,
        data: addresses,
      });
    }
  }

  async removeAddresses(addressesToRemove: string[]) {
    const addresses = addressesToRemove.filter(
      address => address && this.accountAlreadySubscribed(address),
    );
    if (addresses.length > 0) {
      await network({
        method: "DELETE",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/addresses/`,
        data: addresses,
      });
      this.suffixes = this.suffixes.filter(
        suffix => !addresses.some(address => addressMatchesSuffix(address, suffix)),
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
