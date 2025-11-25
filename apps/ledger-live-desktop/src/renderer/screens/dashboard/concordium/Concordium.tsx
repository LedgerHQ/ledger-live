// ~/renderer/screens/dashboard/Concordium.tsx
import React, { useCallback, useState, useRef, useEffect } from "react";
import { Text, Button } from "@ledgerhq/react-ui/index";
import Box from "~/renderer/components/Box";
import SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";
import { ConcordiumIDAppPoup, ConcordiumIDAppSDK } from "@concordium/id-app-sdk";
import { saveConcordiumAccount } from "./useConcordiumAccountScan";
import ConcordiumAccounts from "./ConcordiumAccounts";

export const CONCORDIUM_NETWORK: "Testnet" | "Mainnet" = "Testnet";

export const CONCORDIUM_CHAIN_IDS = {
  Mainnet: "ccd:9dd9ca4d19e9393877d2c44b70f89acb",
  Testnet: "ccd:4221332d34e1694168c2a0c0b3fd0f27",
} as const;

export const DEMO_SEED_PHRASE =
  "question barrel tuna spoil across gaze soup verify melt noise feel measure";

export default function Concordium() {
  const [client, setClient] = useState<SignClient | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);

  const [availableSessions, setAvailableSessions] = useState<SessionTypes.Struct[]>([]);
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  const accountIndexRef = useRef(0);
  const accountsRef = useRef<{ refresh: () => void } | null>(null);

  const getOrInitClient = useCallback(async () => {
    if (client) return client;

    const c = await SignClient.init({
      projectId: "TODO",
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

  const autoSelectLatestSession = useCallback(async (c: SignClient) => {
    const all = c.session.getAll();
    const concordiumSessions = all.filter(s => "concordium" in s.namespaces);

    if (concordiumSessions.length > 0) {
      const sorted = concordiumSessions.sort((a, b) => b.expiry - a.expiry);
      const latest = sorted[0];
      console.log("[Concordium] Auto-selected latest session:", latest.topic);
      setSession(latest);
      return latest;
    }
    return null;
  }, []);

  useEffect(() => {
    const init = async () => {
      const c = await getOrInitClient();
      await autoSelectLatestSession(c);
    };
    init();
  }, [getOrInitClient, autoSelectLatestSession]);

  const onRecoverAccount = useCallback(async () => {
    console.log("[Concordium] onRecoverAccount – TODO: implement ConcordiumIDAppSDK flow");
  }, []);

  const pairWithIdApp = useCallback(async () => {
    const c = await getOrInitClient();
    setIsPairing(true);

    const chainId = CONCORDIUM_CHAIN_IDS[CONCORDIUM_NETWORK];
    console.log({ chainId });

    const { uri: wcUri, approval: wcApproval } = await c.connect({
      requiredNamespaces: {
        concordium: {
          methods: ["create_account", "recover_account"],
          chains: [chainId],
          events: [],
        },
      },
    });

    if (!wcUri) {
      console.error("[Concordium] WalletConnect connect() returned no URI");
      setIsPairing(false);
      return;
    }

    setUri(wcUri);
    console.log("[Concordium] WC URI:", wcUri);

    ConcordiumIDAppPoup.invokeIdAppDeepLinkPopup({
      walletConnectUri: wcUri,
    });

    try {
      const s = await wcApproval();
      console.log("[Concordium] WC session established:", s.topic);
      setSession(s);
      setUri(null);
    } catch (e) {
      console.error("[Concordium] WC approval failed:", e);
    } finally {
      setIsPairing(false);
    }
  }, [getOrInitClient]);

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

      const concordiumNs = session.namespaces["concordium"];

      if (!concordiumNs) {
        throw new Error("[Concordium] No 'concordium' namespace in WC session");
      }
      console.log({ concordiumNs });

      const chainId = CONCORDIUM_CHAIN_IDS[CONCORDIUM_NETWORK];
      // const chainIdFromNs =
      //   concordiumNs.chains?.[0] ?? concordiumNs.accounts?.[0]?.split(":").slice(0, 2).join(":");
      //
      // if (!chainIdFromNs) {
      //   console.error("[Concordium] session.namespaces.concordium:", concordiumNs);
      //   throw new Error("[Concordium] Could not determine chainId from session namespaces");
      // }
      //
      // console.log({ chainIdFromNs });
      const response: any = await client.request({
        topic: session.topic,
        chainId: chainId,
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

      saveConcordiumAccount({ address: accountAddress, txHash });

      // Trigger refresh in accounts component
      accountsRef.current?.refresh();

      return { accountAddress, txHash };
    } catch (e) {
      console.error("[Concordium] create_account flow failed", e);
      throw e;
    }
  }, [client, session]);

  const openCreatePopup = useCallback(async () => {
    if (!session) {
      console.warn("[Concordium] No session – pair first");
      return;
    }

    ConcordiumIDAppPoup.invokeIdAppActionsPopup({
      onCreateAccount,
      walletConnectSessionTopic: session.topic,
    });
  }, [session, onCreateAccount]);

  const openRecoverPopup = useCallback(async () => {
    ConcordiumIDAppPoup.invokeIdAppActionsPopup({
      onRecoverAccount,
    });
  }, [onRecoverAccount]);

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

  const status = session
    ? "Session active"
    : isPairing
      ? "Pairing…"
      : uri
        ? "Waiting approval"
        : "Not paired";

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
        <Box horizontal alignItems="center" gap={2}>
          <Box
            px={2}
            py={1}
            borderRadius={999}
            style={{
              backgroundColor: CONCORDIUM_NETWORK === "Mainnet" ? "#1a2438" : "#0b2438",
              border: `1px solid ${CONCORDIUM_NETWORK === "Mainnet" ? "#3a4a68" : "#214667"}`,
            }}
          >
            <Text fontSize={10} color="neutral.c80">
              {CONCORDIUM_NETWORK}
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
      </Box>

      {/* Active session info */}
      {session && (
        <Box
          mb={4}
          p={3}
          borderRadius={8}
          style={{ backgroundColor: "#0b1a12", border: "1px solid #1a4d2e" }}
        >
          <Text fontSize={12} color="success.c60">
            Connected to: {session.peer?.metadata?.name ?? "Unknown"}
          </Text>
          <Text fontSize={10} color="neutral.c60" fontFamily="monospace">
            {session.topic.slice(0, 16)}…{session.topic.slice(-8)}
          </Text>
        </Box>
      )}

      {/* Actions */}
      <Box mb={4}>
        <Text variant="subtitle" mb={2}>
          Actions
        </Text>

        <Box horizontal gap={3} flexWrap="wrap">
          <Button onClick={pairWithIdApp} variant="shade" disabled={isPairing}>
            {isPairing ? "Pairing…" : "Pair / Open IDApp"}
          </Button>
          <Button onClick={openCreatePopup} variant="main" disabled={!session}>
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

      {/* Accounts component */}
      <ConcordiumAccounts network={CONCORDIUM_NETWORK} />

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
              style={{
                backgroundColor: s.topic === session?.topic ? "#0b1a12" : "#050811",
                border: `1px solid ${s.topic === session?.topic ? "#1a4d2e" : "#283347"}`,
              }}
            >
              <Text fontSize={12} color="neutral.c80">
                topic:{" "}
                <span style={{ fontFamily: "monospace" }}>
                  {s.topic.slice(0, 10)}…{s.topic.slice(-6)}
                </span>
                {s.topic === session?.topic && (
                  <span style={{ color: "#4ade80", marginLeft: 8 }}>● active</span>
                )}
              </Text>
              <Text fontSize={12} color="neutral.c80">
                peer: {s.peer?.metadata?.name ?? "Unknown"}
              </Text>
              <Button
                mt={2}
                variant={s.topic === session?.topic ? "shade" : "main"}
                onClick={() => chooseSession(s)}
                small
                disabled={s.topic === session?.topic}
              >
                {s.topic === session?.topic ? "Currently active" : "Use this session"}
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
