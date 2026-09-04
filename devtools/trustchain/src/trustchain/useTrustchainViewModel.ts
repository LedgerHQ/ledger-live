import { useCallback, useMemo, useState } from "react";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
  TrustchainMember,
  TrustchainDevToolProps,
} from "../types";

export function useTrustchainViewModel(props: TrustchainDevToolProps) {
  const {
    createSdk,
    liveState,
    trustchainApiBaseUrl,
    useProd,
    setUseProd,
    onMemberCredentialsChange,
    onTrustchainChange,
  } = props;

  // ── Tool-local settings ────────────────────────────────────────────────────
  const [deviceId, setDeviceId] = useState("webhid");

  // ── Device interaction overlay ─────────────────────────────────────────────
  const [deviceInteractionVisible, setDeviceInteractionVisible] = useState(false);
  const callbacks = useMemo<TrustchainDeviceCallbacks>(
    () => ({
      onStartRequestUserInteraction: () => setDeviceInteractionVisible(true),
      onEndRequestUserInteraction: () => setDeviceInteractionVisible(false),
    }),
    [],
  );

  // ── SDK — recreated when the global env URL changes ────────────────────────
  const sdk = useMemo(() => createSdk({ trustchainApiBaseUrl }), [createSdk, trustchainApiBaseUrl]);

  // ── Trustchain state — seeded from liveState on mount, written back on change
  const [memberCredentials, setMemberCredentials] = useState<MemberCredentials | null>(
    () => liveState?.memberCredentials ?? null,
  );
  const [trustchain, setTrustchain] = useState<Trustchain | null>(
    () => liveState?.trustchain ?? null,
  );
  const [members, setMembers] = useState<TrustchainMember[] | null>(null);

  const writeMemberCredentials = useCallback(
    (mc: MemberCredentials | null) => {
      setMemberCredentials(mc);
      onMemberCredentialsChange?.(mc);
    },
    [setMemberCredentials, onMemberCredentialsChange],
  );

  const writeTrustchain = useCallback(
    (tc: Trustchain | null) => {
      setTrustchain(tc);
      onTrustchainChange?.(tc);
    },
    [setTrustchain, onTrustchainChange],
  );

  return {
    // tool-local settings
    deviceId,
    setDeviceId,
    trustchainApiBaseUrl,
    useProd,
    setUseProd,
    // device
    deviceInteractionVisible,
    callbacks,
    // sdk
    sdk,
    // state
    memberCredentials,
    setMemberCredentials: writeMemberCredentials,
    trustchain,
    setTrustchain: writeTrustchain,
    members,
    setMembers,
    // app's live state (read-only inspector)
    liveState,
  };
}

export type TrustchainViewModel = ReturnType<typeof useTrustchainViewModel>;
