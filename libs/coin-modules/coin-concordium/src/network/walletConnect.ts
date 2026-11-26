import { getEnv } from "@ledgerhq/live-env";
import SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";
import { log } from "@ledgerhq/logs";
import type {
  ConcordiumNetwork,
  IDAppCreateAccountParams,
  IDAppCreateAccountResponse,
} from "../types";
import { CONCORDIUM_CHAIN_IDS } from "../constants";

const REQUEST_CREATE_ACCOUNT_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

const PROJECT_ID = getEnv("WALLETCONNECT_PROJECT_ID");

/**
 * One SignClient per process, outliving clearWalletConnect(). WalletConnect Core is a
 * process-wide singleton, and on each heartbeat every SignClient unsubscribes the shared
 * relayer topics that are not its own sessions, its own pending sessions, a pairing or its
 * auth response topic. Two SignClients would drop each other's session topics.
 * The first pairing therefore fixes the relay until restart.
 */
let sharedSignClient: Promise<SignClient> | null = null;
let sharedRelayUrl: string | null = null;

function getSharedSignClient(relayUrl: string): Promise<SignClient> {
  if (sharedSignClient && relayUrl !== sharedRelayUrl) {
    log("concordium-onboarding", "Ignoring a relay URL change until restart", {
      active: sharedRelayUrl,
      requested: relayUrl,
    });
  }
  sharedRelayUrl ??= relayUrl;
  sharedSignClient ??= SignClient.init({ projectId: PROJECT_ID, relayUrl }).catch(
    (error: unknown) => {
      sharedSignClient = null;
      sharedRelayUrl = null;
      throw error;
    },
  );

  return sharedSignClient;
}

export class ConcordiumWalletConnect {
  client: SignClient | null = null;

  private readonly namespace: string = "ccd";

  /**
   * Topics of the sessions approved through this instance, i.e. this onboarding attempt.
   * The SignClient is shared, so an approval from an abandoned attempt can still settle in it;
   * getSession must not pick that session.
   */
  private readonly approvedTopics = new Set<string>();

  /** Initializes the shared client on first use. Only pairing calls this. */
  async getClient(relayUrl: string): Promise<SignClient> {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = await getSharedSignClient(relayUrl);

      return this.client;
    } catch (error) {
      this.client = null;
      log("concordium-onboarding", "Failed to initialize WalletConnect client", { error });
      throw error;
    }
  }

  isSessionValid(session: SessionTypes.Struct): boolean {
    return session.expiry * 1000 > Date.now();
  }

  private getNetworksFromSession(session: SessionTypes.Struct): ConcordiumNetwork[] {
    const chains = session.namespaces[this.namespace]?.chains;
    const networks: ConcordiumNetwork[] = [];

    if (chains?.includes(CONCORDIUM_CHAIN_IDS.mainnet)) {
      networks.push("mainnet");
    }

    if (chains?.includes(CONCORDIUM_CHAIN_IDS.testnet)) {
      networks.push("testnet");
    }

    return networks;
  }

  /** The shared client if a pairing in this process initialized it; cleanup has no relay URL. */
  private async getExistingClient(): Promise<SignClient | null> {
    this.client ??= sharedSignClient ? await sharedSignClient : null;
    return this.client;
  }

  private async getConcordiumSessions(): Promise<SessionTypes.Struct[]> {
    const client = await this.getExistingClient();

    if (!client) return [];

    return client.session.getAll().filter(s => this.namespace in s.namespaces);
  }

  async getSession(network: ConcordiumNetwork): Promise<SessionTypes.Struct | null> {
    const concordiumSessions = await this.getConcordiumSessions();

    const filteredSessions = concordiumSessions
      .filter(
        s =>
          this.approvedTopics.has(s.topic) &&
          this.getNetworksFromSession(s).includes(network) &&
          this.isSessionValid(s),
      )
      .sort((a, b) => b.expiry - a.expiry);

    return filteredSessions[0] ?? null;
  }

  async disconnectAllSessions(): Promise<void> {
    try {
      const client = await this.getExistingClient();
      if (!client) return;

      const concordiumSessions = await this.getConcordiumSessions();

      if (concordiumSessions.length === 0) return;

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
            log(
              "concordium-onboarding",
              `Failed to disconnect Wallet Connect session ${session.topic}`,
              error,
            );
          }
        }),
      );
    } catch (error) {
      log("concordium-onboarding", "Failed to disconnect all Wallet Connect sessions", { error });
    }
  }

  async requestCreateAccount(
    params: IDAppCreateAccountParams,
  ): Promise<IDAppCreateAccountResponse> {
    const client = await this.getExistingClient();
    if (!client) {
      throw new Error("WalletConnect client is not initialized. Pair with Concordium IDApp first.");
    }

    return client.request<IDAppCreateAccountResponse>({
      topic: params.topic,
      chainId: params.chainId,
      request: {
        method: "create_account",
        params: params.params,
      },
      expiry: REQUEST_CREATE_ACCOUNT_EXPIRY,
    });
  }

  async initiatePairing(
    _network: ConcordiumNetwork,
    chainId: string,
    relayUrl: string,
  ): Promise<{
    uri?: string;
    approval: () => Promise<SessionTypes.Struct>;
  }> {
    try {
      const client = await this.getClient(relayUrl);

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

      const pairing = await client.connect({
        requiredNamespaces: {
          ccd: {
            methods: ["create_account"],
            chains: [chainId],
            events: [],
          },
        },
      });

      return {
        ...pairing,
        approval: async () => {
          const session = await pairing.approval();
          this.approvedTopics.add(session.topic);
          return session;
        },
      };
    } catch (error) {
      log("concordium-onboarding", "Failed to initiate Wallet Connect pairing", { error });
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
