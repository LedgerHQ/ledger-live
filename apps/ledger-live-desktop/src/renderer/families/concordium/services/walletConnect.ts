import type { ConcordiumNetwork } from "@ledgerhq/coin-concordium";
import { CONCORDIUM_CHAIN_IDS } from "@ledgerhq/coin-concordium/constants";
import { submitCCDTransaction as submitCCDTransactionImpl } from "@ledgerhq/coin-concordium/network/onboard";
import type {
  ConcordiumWalletConnectContext,
  IDAppCreateAccountMessage,
  IDAppCreateAccountParams,
  CredentialDeploymentTransaction,
  IDAppCreateAccountResponse,
} from "@ledgerhq/coin-concordium/types";
import SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import logger from "~/renderer/logger";

const CLIENT_CONFIG = {
  // FIXME: Use env variable
  projectId: "255a67952f9dcfddbc3b1e4581bc75a3",
  relayUrl: "wss://relay.walletconnect.com",
  // FIXME: Update metadata
  metadata: {
    name: "Ledger Live – Concordium",
    description: "Concordium IDApp SDK integration",
    url: "https://www.ledger.com",
    icons: ["https://www.ledger.com/wp-content/uploads/2021/03/favicon-192x192-1.png"] as string[],
  },
};

class ConcordiumWalletConnect implements ConcordiumWalletConnectContext {
  client: SignClient | null = null;

  async getClient(): Promise<SignClient> {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = await SignClient.init(CLIENT_CONFIG);

      return this.client;
    } catch (error) {
      this.client = null;
      logger.error("[ConcordiumWalletConnect] Failed to initialize client:", error);
      throw error;
    }
  }

  isSessionValid(session: SessionTypes.Struct): boolean {
    return session.expiry * 1000 > Date.now();
  }

  private getNetworksFromSession(session: SessionTypes.Struct): ConcordiumNetwork[] {
    const chains = session.namespaces.ccd?.chains;
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

    return client.session.getAll().filter(s => "ccd" in s.namespaces);
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
            logger.warn(
              `[ConcordiumWalletConnect] Failed to disconnect session ${session.topic}:`,
              error,
            );
          }
        }),
      );
    } catch (error) {
      logger.error("[ConcordiumWalletConnect] Error disconnecting all sessions:", error);
    }
  }

  getCreateAccountMessage(publicKey: string, reason: string): IDAppCreateAccountMessage {
    return {
      publicKey,
      reason,
    };
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

  async submitCCDTransaction(
    credentialDeploymentTransaction: CredentialDeploymentTransaction,
    signature: string,
    currency: CryptoCurrency,
  ): Promise<string> {
    return await submitCCDTransactionImpl(credentialDeploymentTransaction, signature, currency);
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
      logger.error("[ConcordiumWalletConnect] initiatePairing error:", error);
      throw error;
    }
  }
}

export const concordiumWalletConnect = new ConcordiumWalletConnect();
