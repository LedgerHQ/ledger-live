import React, { useCallback, useState } from "react";
import { Text, Button } from "@ledgerhq/react-ui/index";
import Box from "~/renderer/components/Box";

import SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";
import { ConcordiumIDAppPoup } from "@concordium/id-app-sdk";

export default function Concordium() {
  const [client, setClient] = useState<SignClient | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [approval, setApproval] = useState<(() => Promise<SessionTypes.Struct>) | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [availableSessions, setAvailableSessions] = useState<SessionTypes.Struct[]>([]);
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  const onCreateAccount = useCallback(async () => {
    console.log("[Concordium] onCreateAccount – TODO: implement ConcordiumIDAppSDK flow");
  }, []);

  const onRecoverAccount = useCallback(async () => {
    console.log("[Concordium] onRecoverAccount – TODO: implement ConcordiumIDAppSDK flow");
  }, []);

  const getOrInitClient = useCallback(async () => {
    if (client) return client;

    const c = await SignClient.init({
      projectId: // NOTE: walletconnect_id,
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

    // encode the URI because the popup route expects encodedUri=
    const encoded = encodeURIComponent(wcUri);
    ConcordiumIDAppPoup.invokeIdAppDeepLinkPopup({
      walletConnectUri: encoded,
    });
  }, [getOrInitClient]);

  const ensureSession = useCallback(async () => {
    if (session) return session;
    if (!approval) {
      console.warn("[Concordium] No pending approval – run pairWithIdApp first");
      return null;
    }

    const s = await approval();
    console.log("[Concordium] WC session established:", s.topic);
    setSession(s);
    return s;
  }, [approval, session]);

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

  // ---- New: list & select existing sessions ----

  const refreshSessions = useCallback(async () => {
    const c = await getOrInitClient();
    const all = c.session.getAll();

    // Optional: only keep sessions that include the concordium namespace
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

      {/* Session picker */}
      {showSessionPicker && availableSessions.length > 0 && (
        <Box
          mt={4}
          p={4}
          borderRadius={12}
          style={{ backgroundColor: "#0a0f18", border: "1px solid #2a3445" }}
        >
          <Text variant="subtitle" mb={3}>
            Existing WalletConnect sessions
          </Text>
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
              <Button mt={2} variant="main" onClick={() => chooseSession(s)}>
                Use this session
              </Button>
            </Box>
          ))}

          {availableSessions.length === 0 && (
            <Text fontSize={12} color="neutral.c80">
              No existing Concordium sessions found.
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}
