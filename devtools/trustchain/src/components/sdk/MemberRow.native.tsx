import { useCallback, useState } from "react";
import { Box, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
  TrustchainMember,
  TrustchainSDK,
} from "../../types";
import { Actionable } from "../Actionable";

const ROW_LX = { flexDirection: "row", alignItems: "center", gap: "s12", padding: "s16" } as const;
const INFO_LX = { gap: "s4" } as const;

export function MemberRow({
  sdk,
  deviceId,
  trustchain,
  memberCredentials,
  member,
  setTrustchain,
  setMembers,
  callbacks,
}: Readonly<{
  sdk: TrustchainSDK;
  deviceId: string;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  member: TrustchainMember;
  setTrustchain: (v: Trustchain | null) => void;
  setMembers: (v: TrustchainMember[] | null) => void;
  callbacks?: TrustchainDeviceCallbacks;
}>) {
  const { theme } = useTheme();
  const [removed, setRemoved] = useState<TrustchainMember | null>(null);

  const action = useCallback(
    (tc: Trustchain, mc: MemberCredentials) =>
      sdk.removeMember(deviceId, tc, mc, member, callbacks).then(async updated => {
        setTrustchain(updated);
        await sdk.getMembers(updated, mc).then(setMembers);
        return member;
      }),
    [sdk, deviceId, member, callbacks, setTrustchain, setMembers],
  );

  return (
    <Box lx={ROW_LX} style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}>
      <Box lx={INFO_LX} style={{ flex: 1 }}>
        <Text typography="body2SemiBold" numberOfLines={1}>
          {member.name || "(no name)"}
        </Text>
        <Text typography="body2" numberOfLines={1}>
          {member.id}
        </Text>
        <Text typography="body2">permissions: {member.permissions}</Text>
      </Box>
      <Actionable
        buttonTitle="Remove"
        inputs={trustchain && memberCredentials ? [trustchain, memberCredentials] : null}
        action={action}
        value={removed}
        setValue={setRemoved}
        valueDisplay={v => `removed: ${v.name || v.id.slice(0, 8)}`}
      />
    </Box>
  );
}
