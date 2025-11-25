import React, { useCallback, useState, useRef } from "react";
import { Text, Button } from "@ledgerhq/react-ui/index";
import Box from "~/renderer/components/Box";
import SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";
import { ConcordiumIDAppPoup, ConcordiumIDAppSDK } from "@concordium/id-app-sdk";
import {
  useConcordiumAccountsScan,
  saveConcordiumAccount,
} from "~/renderer/screens/dashboard/useConcordiumAccountScan";

// const CONCORDIUM_NETWORK: "Testnet" | "Mainnet" = "Testnet";
export const CONCORDIUM_NETWORK: "Testnet" | "Mainnet" = "Mainnet";

// ⚠️ DEMO ONLY – replace with real seed from your key management
export const DEMO_SEED_PHRASE =
  "wish busy never sauce cheese foil process intact click slush slice like";

export default function Concordium() {
  const [client, setClient] = useState<SignClient | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [approval, setApproval] = useState<(() => Promise<SessionTypes.Struct>) | null>(null);
  const [uri, setUri] = useState<string | null>(null);

  const [availableSessions, setAvailableSessions] = useState<SessionTypes.Struct[]>([]);
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  // track account index for generateAccountWithSeedPhrase
  const accountIndexRef = useRef(0);

  // ---- accounts (saved locally + enriched via gRPC in the hook) ----
  const {
    accounts,
    isLoading: isAccountsLoading,
    error: accountsError,
    refresh: refreshAccounts,
  } = useConcordiumAccountsScan();

  const getOrInitClient = useCallback(async () => {
    if (client) return client;

    const c = await SignClient.init({
      projectId: "TODO_WALLETCONNECT_PROJECTID",
      relayUrl: "wss://relay.walletconnect.com",
      metadata: {
        name: "Ledger Live – Concordium",
        description: "Concordium IDApp SDK playground",
        url: "https://www.ledger.com",
        icons: ["https://www.ledger.com/wp-content/uploads/2021/03/favicon-192x192-1.png"],
      },
    });

    setClient(c);
    return c;
  }, [client]);

  const onRecoverAccount = useCallback(async () => {
    console.log("[Concordium] onRecoverAccount – TODO: implement ConcordiumIDAppSDK flow");
  }, []);

  const pairWithIdApp = useCallback(async () => {
    const c = await getOrInitClient();

    const { uri: wcUri, approval: wcApproval } = await c.connect({
      requiredNamespaces: {
        concordium: {
          methods: ["create_account", "recover_account"],
          chains: ["concordium:919"],
          events: [],
        },
      },
    });

    if (!wcUri) {
      console.error("[Concordium] WalletConnect connect() returned no URI");
      return;
    }

    setUri(wcUri);
    setApproval(() => wcApproval);

    console.log("[Concordium] WC URI:", wcUri);

    ConcordiumIDAppPoup.invokeIdAppDeepLinkPopup({
      walletConnectUri: wcUri,
    });
  }, [getOrInitClient]);

  const ensureSession = useCallback(async () => {
    if (session) return session;
    if (!approval) {
      console.warn("[Concordium] No pending approval – run pairWithIdApp first or select session");
      return null;
    }

    const s = await approval();
    console.log("[Concordium] WC session established:", s.topic);
    setSession(s);
    return s;
  }, [approval, session]);

  /**
   * Full Concordium IDApp SDK flow for *creating* an account.
   * Called by the Concordium popup when user clicks "Create New Account".
   */
  const onCreateAccount = useCallback(async () => {
    if (!client || !session) {
      console.error("[Concordium] Missing WalletConnect client or session");
      throw new Error("WalletConnect client/session not ready");
    }

    try {
      console.log("[Concordium] Starting create_account flow…");

      const accountIndex = accountIndexRef.current;
      const account: any = ConcordiumIDAppSDK.generateAccountWithSeedPhrase(
        DEMO_SEED_PHRASE,
        CONCORDIUM_NETWORK,
        accountIndex,
      );

      console.log("[Concordium] Generated Concordium account", {
        accountIndex,
        publicKey: account.publicKey,
      });

      const createRequest: any = ConcordiumIDAppSDK.getCreateAccountCreationRequest(
        account.publicKey,
        "Create Concordium account from Ledger Live",
      );

      console.log("[Concordium] session.namespaces:", session.namespaces);
      // Figure out the proper chainId from the approved session
      const concordiumNs = session.namespaces["concordium"];

      if (!concordiumNs) {
        throw new Error("[Concordium] No 'concordium' namespace in WC session");
      }

      // Prefer explicit chains[], otherwise derive from accounts["namespace:chainId:address"]
      const chainIdFromNs =
        concordiumNs.chains?.[0] ?? concordiumNs.accounts?.[0]?.split(":").slice(0, 2).join(":"); // e.g. "concordium:919"

      if (!chainIdFromNs) {
        console.error("[Concordium] session.namespaces.concordium:", concordiumNs);
        throw new Error("[Concordium] Could not determine chainId from session namespaces");
      }
      console.log({ session, chainIdFromNs });

      const response: any = await client.request({
        topic: session.topic,
        chainId: chainIdFromNs,
        request: {
          method: "create_account",
          params: { message: createRequest },
        },
      });

      console.log("[Concordium] IDApp create_account response:", response);

      if (!response || response.status !== "success") {
        console.error("[Concordium] IDApp error:", response?.message);
        throw new Error(
          `IDApp create_account failed: ${response?.message?.details ?? "unknown error"}`,
        );
      }

      const { serializedCredentialDeploymentTransaction, accountAddress } = response.message;

      const signed: any = await ConcordiumIDAppSDK.signCredentialTransaction(
        serializedCredentialDeploymentTransaction,
        account.signingKey,
      );

      console.log("[Concordium] Signed credential deployment tx");

      const txHash: string = await ConcordiumIDAppSDK.submitCCDTransaction(
        signed.credentialDeploymentTransaction,
        signed.signature,
        CONCORDIUM_NETWORK,
      );

      console.log("[Concordium] Concordium account created", {
        accountAddress,
        txHash,
      });

      accountIndexRef.current += 1;

      // ✅ persist locally so the hook can list it (and then enrich via gRPC)
      saveConcordiumAccount({ address: accountAddress, txHash });
      // Optional: immediately refresh the hook data
      refreshAccounts();

      return { accountAddress, txHash };
    } catch (e) {
      console.error("[Concordium] create_account flow failed", e);
      throw e;
    }
  }, [client, session, refreshAccounts]);

  const openCreatePopup = useCallback(async () => {
    const s = await ensureSession();
    if (!s) return;

    ConcordiumIDAppPoup.invokeIdAppActionsPopup({
      onCreateAccount,
      walletConnectSessionTopic: s.topic,
    });
  }, [ensureSession, onCreateAccount]);

  const openRecoverPopup = useCallback(async () => {
    ConcordiumIDAppPoup.invokeIdAppActionsPopup({
      onRecoverAccount,
    });
  }, [onRecoverAccount]);

  // ---- list & select existing sessions ----

  const refreshSessions = useCallback(async () => {
    const c = await getOrInitClient();
    const all = c.session.getAll();

    const concordiumSessions = all.filter(s => "concordium" in s.namespaces);

    console.log("[Concordium] Existing sessions:", concordiumSessions);
    setAvailableSessions(concordiumSessions);
    setShowSessionPicker(true);
  }, [getOrInitClient]);

  const chooseSession = useCallback((s: SessionTypes.Struct) => {
    console.log("[Concordium] Using existing session:", s.topic);
    setSession(s);
    setShowSessionPicker(false);
  }, []);

  const status = session ? "Session active" : uri ? "Waiting approval" : "Not paired";

  return (
    <Box
      flow={7}
      id="concordium-container"
      data-testid="concordium-container"
      p={6}
      style={{
        backgroundColor: "#05070b",
        borderRadius: 16,
        border: "1px solid #1e2430",
      }}
    >
      {/* Header */}
      <Box horizontal alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Text variant="h3Inter" fontWeight="semiBold">
            Concordium test
          </Text>
          <Text color="neutral.c80" fontSize={12}>
            IDApp SDK · WalletConnect pairing + actions
          </Text>
        </Box>
        <Box
          px={3}
          py={1}
          borderRadius={999}
          style={{ backgroundColor: "#0b2438", border: "1px solid #214667" }}
        >
          <Text fontSize={11} color="wallet" fontWeight="semiBold">
            {status}
          </Text>
        </Box>
      </Box>

      {/* Actions */}
      <Box mb={4}>
        <Text variant="subtitle" mb={2}>
          Actions
        </Text>

        <Box horizontal gap={3} flexWrap="wrap">
          <Button onClick={pairWithIdApp} variant="shade">
            Pair / Open IDApp
          </Button>
          <Button onClick={openCreatePopup} variant="main">
            Create account
          </Button>
          <Button onClick={openRecoverPopup} variant="shade">
            Recover account
          </Button>
          <Button onClick={refreshSessions} variant="shade">
            Select existing session
          </Button>
        </Box>
      </Box>

      {/* Saved accounts + on-chain info */}
      <Box mt={6}>
        <Box horizontal justifyContent="space-between" alignItems="center" mb={2}>
          <Text variant="subtitle">Saved Concordium accounts</Text>
          <Button small variant="shade" onClick={refreshAccounts}>
            Refresh
          </Button>
        </Box>

        {isAccountsLoading && (
          <Text fontSize={12} color="neutral.c80">
            Loading accounts…
          </Text>
        )}

        {accountsError && (
          <Text fontSize={12} color="error.c60">
            {accountsError.message}
          </Text>
        )}

        {!isAccountsLoading && !accountsError && accounts.length === 0 && (
          <Text fontSize={12} color="neutral.c80">
            No saved accounts yet.
          </Text>
        )}

        {accounts.map(acc => (
          <Box
            key={`${acc.address}-${acc.createdAt}`}
            mb={2}
            p={3}
            borderRadius={8}
            style={{ backgroundColor: "#050811", border: "1px solid #283347" }}
          >
            <Text fontSize={12} color="wallet" fontFamily="monospace">
              {acc.address}
            </Text>

            {acc.txHash && (
              <Text fontSize={10} color="neutral.c60">
                tx: {acc.txHash}
              </Text>
            )}

            {acc.info && (
              <Text fontSize={10} color="neutral.c60">
                balance: {acc.info.accountAmount?.microCcd ?? "?"} μCCD
              </Text>
            )}

            {acc.info === null && (
              <Text fontSize={10} color="error.c60">
                Account not found on-chain
              </Text>
            )}
          </Box>
        ))}
      </Box>

      {/* Session picker */}
      {showSessionPicker && (
        <Box
          mt={4}
          p={4}
          borderRadius={12}
          style={{ backgroundColor: "#0a0f18", border: "1px solid #2a3445" }}
        >
          <Text variant="subtitle" mb={3}>
            Existing WalletConnect sessions
          </Text>

          {availableSessions.length === 0 && (
            <Text fontSize={12} color="neutral.c80">
              No existing Concordium sessions found.
            </Text>
          )}

          {availableSessions.map(s => (
            <Box
              key={s.topic}
              mb={2}
              p={3}
              borderRadius={8}
              style={{ backgroundColor: "#050811", border: "1px solid #283347" }}
            >
              <Text fontSize={12} color="neutral.c80">
                topic:{" "}
                <span style={{ fontFamily: "monospace" }}>
                  {s.topic.slice(0, 10)}…{s.topic.slice(-6)}
                </span>
              </Text>
              <Text fontSize={12} color="neutral.c80">
                peer: {s.peer?.metadata?.name ?? "Unknown"}
              </Text>
              <Button mt={2} variant="main" onClick={() => chooseSession(s)} small>
                Use this session
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
