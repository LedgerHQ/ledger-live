import network from "@ledgerhq/live-network/network";
import type { ChainwatchNetwork, ChainwatchAccount, Account } from "@ledgerhq/types-live";

class ChainwatchAccountManager {
    chainwatchBaseUrl: string;
    userId: string;
    network: ChainwatchNetwork;
    
    constructor(
        chainwatchBaseUrl: string,
        userId: string,
        network: ChainwatchNetwork,
    ) {
      this.chainwatchBaseUrl = chainwatchBaseUrl;
      this.userId = userId;
      this.network = network;
    }

    async getChainwatchAccount(): Promise<ChainwatchAccount> {
        const { data } = await network({
            method: "GET",
            url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}`,
        });

        console.log("getChainwatchAccount", data);
        return data;
    }

    async registerNewChainwatchAccount() {
        const { data } = await network({
            method: "PUT",
            url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}`,
        });

        console.log("registerNewChainwatchAccount", data);
    }

    async registerNewAccountsAddresses(accountsToRegister: Account[]): Promise<string[]> {
        const { data } = await network({
            method: "GET",
            url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}`,
        });

        console.log("registerNewAccountsAddresses", data);
        return data;
    }

    async removeAccountsAddresses(accountsToRemove: any[]) {
        const { data } = await network({
            method: "GET",
            url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}`,
        });

        console.log("removeAccountsAddresses", data);
    }

    async registerNewMonitor() {
        const { data } = await network({
            method: "GET",
            url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}`,
        });

        console.log("registerNewMonitor", data);
    }

    async registerNewTarget() {
        const { data } = await network({
            method: "GET",
            url: `${this.chainwatchBaseUrl}/${this.network.chainwatchId}/account/${this.userId}`,
        });

        console.log("registerNewTarget", data);
    }
}
  
export default ChainwatchAccountManager;  
