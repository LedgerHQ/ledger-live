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
    } catch (err) {
      console.error("err get account", err);
    }
  }

  async removeChainwatchAccount() {
    try {
      await network({
        method: "DELETE",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/`,
      });
    } catch (err) {
      console.error("err remove account", err);
    }
  }

  async registerNewChainwatchAccount() {
    try {
      await network({
        method: "PUT",
        url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}/`,
      });
    } catch (err) {
      console.error("err put account", err);
    }
  }

  getAccountAddress(account: Account) {
    return account.freshAddresses.length > 0 && account.freshAddresses[0]?.address;
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
    } catch (err) {
      console.error("err put new addresses", err);
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
    } catch (err) {
      console.error("err delete addresses", err);
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
    } catch (err) {
      console.error("err put monitor", err);
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
    } catch (err) {
      console.error("err put target", err);
    }
  }

  async setupChainwatchAccount() {
    // Get or set Chainwatch Account
    let chainwatchAccount = await this.getChainwatchAccount();
    if (!chainwatchAccount) {
      await this.registerNewChainwatchAccount();
      chainwatchAccount = await this.getChainwatchAccount();
    }
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

export default ChainwatchAccountManager;
