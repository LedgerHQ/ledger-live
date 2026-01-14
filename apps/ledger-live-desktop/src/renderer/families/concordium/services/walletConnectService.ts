import type { ConcordiumNetwork } from "@ledgerhq/coin-concordium";
import { CONCORDIUM_CHAIN_IDS } from "@ledgerhq/coin-concordium/constants";
import SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";
import logger from "~/renderer/logger";

const CLIENT_CONFIG = {
  projectId: "255a67952f9dcfddbc3b1e4581bc75a3",
  relayUrl: "wss://relay.walletconnect.com",
  metadata: {
    name: "Ledger Live – Concordium",
    description: "Concordium IDApp SDK integration",
    url: "https://www.ledger.com",
    icons: ["https://www.ledger.com/wp-content/uploads/2021/03/favicon-192x192-1.png"] as string[],
  },
};

class WalletConnectService {
  private client: SignClient | null = null;

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

  private isSessionValid(session: SessionTypes.Struct): boolean {
    return session.expiry * 1000 > Date.now();
  }

  private getNetworksFromSession(session: SessionTypes.Struct): ConcordiumNetwork[] {
    const chains = session.namespaces.concordium?.chains;
    const networks: ConcordiumNetwork[] = [];

    if (chains?.includes(CONCORDIUM_CHAIN_IDS.Mainnet)) {
      networks.push("Mainnet");
    }

    if (chains?.includes(CONCORDIUM_CHAIN_IDS.Testnet)) {
      networks.push("Testnet");
    }

    return networks;
  }

  async getSessionForNetwork(network: ConcordiumNetwork): Promise<SessionTypes.Struct | null> {
    const client = await this.getClient();

    if (!client) return null;

    const sessions = client.session
      .getAll()
      .filter(
        s =>
          "concordium" in s.namespaces &&
          this.getNetworksFromSession(s).includes(network) &&
          this.isSessionValid(s),
      )
      .sort((a, b) => b.expiry - a.expiry);

    return sessions[0] ?? null;
  }

  async disconnectAllSessions(): Promise<void> {
    const client = await this.getClient();

    if (!client) return;

    try {
      const concordiumSessions = client.session
        .getAll()
        .filter(s => "concordium" in s.namespaces && this.isSessionValid(s));

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

  async cleanupExpiredPairingProposals(): Promise<void> {
    const client = await this.getClient();

    if (!client) return;

    try {
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
    } catch (error) {
      logger.warn("[ConcordiumWalletConnect] Failed to cleanup expired pairings:", error);
    }
  }
}

export const walletConnectService = new WalletConnectService();
