import { Modal, ScrollView, TextInput, View } from "react-native";
import { Box, Button, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { InitCredentials } from "../components/sdk/InitCredentials";
import { GetOrCreateTrustchain } from "../components/sdk/GetOrCreateTrustchain";
import { RestoreTrustchain } from "../components/sdk/RestoreTrustchain";
import { GetMembers } from "../components/sdk/GetMembers";
import { MemberRow } from "../components/sdk/MemberRow";
import { EncryptUserData } from "../components/sdk/EncryptUserData";
import { DecryptUserData } from "../components/sdk/DecryptUserData";
import { DestroyApplication } from "../components/sdk/DestroyApplication";
import { DestroyTrustchain } from "../components/sdk/DestroyTrustchain";
import { useTrustchainViewModel } from "./useTrustchainViewModel";
import type { TrustchainDevToolProps } from "../types";

const BANNER_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s16",
  padding: "s16",
} as const;
const SECTION_LX = { padding: "s16", gap: "s4" } as const;
const ENV_ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s12",
  padding: "s16",
} as const;
const ENV_BTN_LX = { flexDirection: "row", gap: "s4" } as const;

export function Trustchain(props: TrustchainDevToolProps) {
  const vm = useTrustchainViewModel(props);
  const { theme } = useTheme();

  return (
    <>
      {/* Device interaction overlay */}
      <Modal transparent visible={vm.deviceInteractionVisible} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text typography="body1" style={{ color: "#fff" }}>
            Approve on device…
          </Text>
        </View>
      </Modal>

      <ScrollView>
        {/* Backend row */}
        <BackendRow url={vm.trustchainApiBaseUrl} useProd={vm.useProd} setUseProd={vm.setUseProd} />

        {/* App live state banner */}
        {vm.liveState ? (
          <Box
            lx={BANNER_LX}
            style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
          >
            <Text typography="body2SemiBold" style={{ color: theme.colors.text.success }}>
              Live state
            </Text>
            {vm.liveState.trustchain ? (
              <Text typography="body2" numberOfLines={1} style={{ flex: 1 }}>
                {vm.liveState.trustchain.rootId.slice(0, 8)}… @{" "}
                {vm.liveState.trustchain.applicationPath}
              </Text>
            ) : (
              <Text typography="body2">no trustchain</Text>
            )}
            {vm.liveState.memberCredentials ? (
              <Text typography="body2" numberOfLines={1}>
                pub:{vm.liveState.memberCredentials.pubkey.slice(0, 12)}…
              </Text>
            ) : null}
          </Box>
        ) : null}

        {/* Device ID */}
        <DeviceControls deviceId={vm.deviceId} setDeviceId={vm.setDeviceId} />

        {/* SDK operations */}
        <Box lx={SECTION_LX}>
          <InitCredentials
            sdk={vm.sdk}
            memberCredentials={vm.memberCredentials}
            setMemberCredentials={vm.setMemberCredentials}
          />
          <GetOrCreateTrustchain
            sdk={vm.sdk}
            deviceId={vm.deviceId}
            memberCredentials={vm.memberCredentials}
            trustchain={vm.trustchain}
            setTrustchain={vm.setTrustchain}
            callbacks={vm.callbacks}
          />
          <RestoreTrustchain
            sdk={vm.sdk}
            memberCredentials={vm.memberCredentials}
            trustchain={vm.trustchain}
            setTrustchain={vm.setTrustchain}
          />
          <GetMembers
            sdk={vm.sdk}
            memberCredentials={vm.memberCredentials}
            trustchain={vm.trustchain}
            members={vm.members}
            setMembers={vm.setMembers}
          />
        </Box>

        {vm.members?.map(member => (
          <MemberRow
            key={member.id}
            sdk={vm.sdk}
            deviceId={vm.deviceId}
            trustchain={vm.trustchain}
            memberCredentials={vm.memberCredentials}
            member={member}
            setTrustchain={vm.setTrustchain}
            setMembers={vm.setMembers}
            callbacks={vm.callbacks}
          />
        ))}

        <Box lx={SECTION_LX}>
          <EncryptUserData sdk={vm.sdk} trustchain={vm.trustchain} />
          <DecryptUserData sdk={vm.sdk} trustchain={vm.trustchain} />
          <DestroyApplication
            sdk={vm.sdk}
            trustchain={vm.trustchain}
            memberCredentials={vm.memberCredentials}
            setTrustchain={vm.setTrustchain}
          />
          <DestroyTrustchain
            sdk={vm.sdk}
            trustchain={vm.trustchain}
            memberCredentials={vm.memberCredentials}
            setTrustchain={vm.setTrustchain}
          />
        </Box>
      </ScrollView>
    </>
  );
}

function BackendRow({
  url,
  useProd,
  setUseProd,
}: Readonly<{
  url: string;
  useProd?: boolean;
  setUseProd?: (v: boolean) => void;
}>) {
  const { theme } = useTheme();
  return (
    <Box
      lx={ENV_ROW_LX}
      style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
    >
      <Text typography="body2">Backend</Text>
      <Text typography="body2" numberOfLines={1} style={{ flex: 1 }}>
        {url}
      </Text>
      {setUseProd ? (
        <Box lx={ENV_BTN_LX}>
          <EnvButton label="STG" active={!useProd} onPress={() => setUseProd(false)} />
          <EnvButton label="PROD" active={!!useProd} onPress={() => setUseProd(true)} />
        </Box>
      ) : null}
    </Box>
  );
}

function EnvButton({
  label,
  active,
  onPress,
}: Readonly<{
  label: string;
  active: boolean;
  onPress: () => void;
}>) {
  return (
    <Button size="sm" appearance={active ? "accent" : "transparent"} onPress={onPress}>
      {label}
    </Button>
  );
}

function DeviceControls({
  deviceId,
  setDeviceId,
}: Readonly<{
  deviceId: string;
  setDeviceId: (id: string) => void;
}>) {
  const { theme } = useTheme();
  return (
    <Box
      lx={ENV_ROW_LX}
      style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
    >
      <Text typography="body2">Device ID</Text>
      <TextInput
        value={deviceId}
        onChangeText={setDeviceId}
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: theme.colors.border.mutedSubtle,
          borderRadius: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 13,
          color: theme.colors.text.base,
        }}
      />
    </Box>
  );
}

export default Trustchain;
