import { getEnv } from "@ledgerhq/live-env";
import SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";
import type { ConcordiumNetwork } from "../types";
import type { IDAppCreateAccountParams, IDAppCreateAccountResponse } from "../types/network";
import { CONCORDIUM_CHAIN_IDS } from "../constants";

const CLIENT_CONFIG = {
  projectId: getEnv("WALLETCONNECT_PROJECT_ID"),
  relayUrl: "wss://relay.walletconnect.com",
};

export class ConcordiumWalletConnect {
  client: SignClient | null = null;

  private namespace: string = "ccd";

  async getClient(): Promise<SignClient> {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = await SignClient.init(CLIENT_CONFIG);

      return this.client;
    } catch (error) {
      this.client = null;
      console.error("[ConcordiumWalletConnect] Failed to initialize client:", error);
      throw error;
    }
  }

  isSessionValid(session: SessionTypes.Struct): boolean {
    return session.expiry * 1000 > Date.now();
  }

  private getNetworksFromSession(session: SessionTypes.Struct): ConcordiumNetwork[] {
    const chains = session.namespaces[this.namespace]?.chains;
    const networks: ConcordiumNetwork[] = [];

    if (chains?.includes(CONCORDIUM_CHAIN_IDS.Mainnet)) {
      networks.push("Mainnet");
    }

    if (chains?.includes(CONCORDIUM_CHAIN_IDS.Testnet)) {
      networks.push("Testnet");
    }

    return networks;
  }

  private async getConcordiumSessions(): Promise<SessionTypes.Struct[]> {
    const client = await this.getClient();

    if (!client) return [];

    return client.session.getAll().filter(s => this.namespace in s.namespaces);
  }

  async getSession(network: ConcordiumNetwork): Promise<SessionTypes.Struct | null> {
    const concordiumSessions = await this.getConcordiumSessions();

    const filteredSessions = concordiumSessions
      .filter(s => this.getNetworksFromSession(s).includes(network) && this.isSessionValid(s))
      .sort((a, b) => b.expiry - a.expiry);

    return filteredSessions[0] ?? null;
  }

  async disconnectAllSessions(): Promise<void> {
    const client = await this.getClient();
    const concordiumSessions = await this.getConcordiumSessions();

    if (concordiumSessions.length === 0) return;

    try {
      await Promise.all(
        concordiumSessions.map(async session => {
          try {
            await client.disconnect({
              topic: session.topic,
              reason: {
                code: 6000,
                message: "User disconnected all sessions",
              },
            });
          } catch (error) {
            console.warn(
              `[ConcordiumWalletConnect] Failed to disconnect session ${session.topic}:`,
              error,
            );
          }
        }),
      );
    } catch (error) {
      console.error("[ConcordiumWalletConnect] Error disconnecting all sessions:", error);
    }
  }

  async requestCreateAccount(
    params: IDAppCreateAccountParams,
  ): Promise<IDAppCreateAccountResponse> {
    const client = await this.getClient();

    return await client.request<IDAppCreateAccountResponse>({
      topic: params.topic,
      chainId: params.chainId,
      request: {
        method: "create_account",
        params: params.params,
      },
    });
  }

  async initiatePairing(
    _network: ConcordiumNetwork,
    chainId: string,
  ): Promise<{
    uri?: string;
    approval: () => Promise<SessionTypes.Struct>;
  }> {
    try {
      const client = await this.getClient();

      const expiredPairings = client.pairing
        .getAll({ active: true })
        .filter(p => p.expiry * 1000 < Date.now());

      await Promise.allSettled(
        expiredPairings.map(pairing =>
          client.pairing.delete(pairing.topic, {
            code: 6001,
            message: "Expired",
          }),
        ),
      );

      return await client.connect({
        requiredNamespaces: {
          ccd: {
            methods: ["create_account", "recover_account"],
            chains: [chainId],
            events: ["proposal_expire", "session_proposal", "session_event"],
          },
        },
      });
    } catch (error) {
      console.error("[ConcordiumWalletConnect] initiatePairing error:", error);
      throw error;
    }
  }
}

let walletConnect: ConcordiumWalletConnect | null = null;

export function setWalletConnect(): ConcordiumWalletConnect {
  walletConnect = walletConnect || new ConcordiumWalletConnect();

  return walletConnect;
}

export function clearWalletConnect(): void {
  walletConnect = null;
}

export function getWalletConnect(): ConcordiumWalletConnect | null {
  return walletConnect;
}
