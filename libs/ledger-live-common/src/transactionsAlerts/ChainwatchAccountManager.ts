import network from "@ledgerhq/live-network/network";
import type {
  ChainwatchNetwork,
  ChainwatchAccount,
  ChainwatchTargetType,
  ChainwatchMonitorType,
  Account,
} from "@ledgerhq/types-live";

class ChainwatchAccountManager {
  chainwatchBaseUrl: string;
  userId: string;
  network: ChainwatchNetwork;
  suffixes: string[];

  constructor(chainwatchBaseUrl: string, userId: string, network: ChainwatchNetwork) {
    this.chainwatchBaseUrl = chainwatchBaseUrl;
    this.userId = userId;
    this.network = network;
    this.suffixes = [];
  }

  async getChainwatchAccount(): Promise<ChainwatchAccount | undefined> {
    try {
      const { data } = await network({
        method: "GET",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/`,
      });
      return data;
    } catch {
      return;
    }
  }

  async removeChainwatchAccount() {
    try {
      await network({
        method: "DELETE",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/`,
      });
    } catch {
      return;
    }
  }

  async registerNewChainwatchAccount() {
    try {
      const { data } = await network({
        method: "PUT",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/`,
      });
      return data;
    } catch {
      return;
    }
  }

  getAccountAddress(account: Account) {
    return account.freshAddress;
  }

  accountAlreadySubscribed(account: Account) {
    const address = this.getAccountAddress(account);
    return (
      address &&
      this.suffixes.some(suffix => address?.toLowerCase()?.endsWith(suffix.toLowerCase()))
    );
  }

  async registerNewAccountsAddresses(accountsToRegister: Account[]) {
    try {
      const addresses = accountsToRegister
        .filter(
          account => this.getAccountAddress(account) && !this.accountAlreadySubscribed(account),
        )
        .map(account => this.getAccountAddress(account));
      if (addresses.length > 0) {
        await network({
          method: "PUT",
          url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/addresses/`,
          data: addresses,
        });
      }
    } catch {
      return;
    }
  }

  async removeAccountsAddresses(accountsToRemove: Account[]) {
    try {
      const addresses = accountsToRemove
        .filter(
          account => this.getAccountAddress(account) && this.accountAlreadySubscribed(account),
        )
        .map(account => this.getAccountAddress(account));
      if (addresses.length > 0) {
        await network({
          method: "DELETE",
          url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/addresses/`,
          data: addresses,
        });
      }
    } catch {
      return;
    }
  }

  async registerNewMonitor(monitor: ChainwatchMonitorType) {
    try {
      await network({
        method: "PUT",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/monitor/`,
        data: {
          confirmations: this.network.nbConfirmations,
          type: monitor,
        },
      });
    } catch {
      return;
    }
  }

  async registerNewTarget(target: ChainwatchTargetType) {
    try {
      await network({
        method: "PUT",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/target/`,
        data: {
          equipment: this.userId,
          type: target,
        },
      });
    } catch {
      return;
    }
  }

  async setupChainwatchAccount() {
    // Get or set Chainwatch Account
    const chainwatchAccount =
      (await this.getChainwatchAccount()) || (await this.registerNewChainwatchAccount());
    if (chainwatchAccount) {
      this.suffixes = chainwatchAccount?.suffixes || [];

      // Set Chainwatch account's monitors (receive and send) if they don't exist yet
      if (!chainwatchAccount?.monitors?.find(monitor => monitor.type === "send")) {
        await this.registerNewMonitor("send");
      }
      if (!chainwatchAccount?.monitors?.find(monitor => monitor.type === "receive")) {
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
