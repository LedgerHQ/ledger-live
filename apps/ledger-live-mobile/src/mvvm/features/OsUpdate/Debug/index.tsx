import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { OsUpdatesOrchestratorComponent } from "@ledgerhq/live-common/os-update/components/OsUpdatesOrchestratorComponent";
import { osUpdatePlatformComponents } from "../components/osUpdatePlatformComponents";
import { WhatsNewScreen } from "../screens/WhatsNewScreen";
import { useOsUpdatesOrchestratorDebugScreenViewModel } from "./useOsUpdatesOrchestratorDebugScreenViewModel";
import type { DebugDiscoveredDevice } from "./types";

export default function OsUpdatesOrchestratorDebugScreen() {
  const viewModel = useOsUpdatesOrchestratorDebugScreenViewModel();

  if (viewModel.orchestratorRun) {
    return (
      <View style={styles.container}>
        <View style={styles.orchestrator}>
          <OsUpdatesOrchestratorComponent
            {...viewModel.orchestratorRun}
            platformComponents={osUpdatePlatformComponents}
          />
        </View>
      </View>
    );
  }

  if (viewModel.whatsNew) {
    return (
      <View style={styles.container}>
        <WhatsNewScreen
          version={viewModel.whatsNew.version}
          notes={viewModel.whatsNew.notes}
          onStart={viewModel.onConfirmStart}
          onClose={viewModel.onStop}
        />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section
          title="Device & connection"
          subtitle="Connects straight to the device, without the legacy My Ledger flow and the bootloader recovery it runs. The session refresher is disabled, as it is for every reconnection the OS update performs."
        >
          <StatusRow label="DMK" value={viewModel.dmkReady ? "ready" : "unavailable"} />
          <StatusRow label="Device id" value={viewModel.deviceId ?? "-"} />
          <StatusRow label="Session id" value={viewModel.sessionId ?? "-"} />
          <StatusRow
            label="Device status"
            value={viewModel.deviceStatus != null ? String(viewModel.deviceStatus) : "-"}
          />
          <Box lx={{ marginTop: "s8", gap: "s8" }}>
            <Button
              size="md"
              appearance="base"
              isFull
              disabled={!viewModel.dmkReady}
              onPress={viewModel.onToggleScan}
            >
              {viewModel.isScanning ? "Stop scanning" : "Scan for devices"}
            </Button>
            <Button
              size="md"
              appearance="base"
              isFull
              disabled={!viewModel.canDisconnect}
              onPress={viewModel.onDisconnect}
            >
              Disconnect
            </Button>
          </Box>
          {viewModel.isScanning && viewModel.discoveredDevices.length === 0 ? (
            <Text typography="body3" lx={{ color: "muted", marginTop: "s8" }}>
              Scanning…
            </Text>
          ) : null}
          {viewModel.discoveredDevices.length > 0 ? (
            <Box lx={{ marginTop: "s8", gap: "s8" }}>
              {viewModel.discoveredDevices.map(device => (
                <DiscoveredDeviceRow
                  key={device.id}
                  device={device}
                  disabled={viewModel.connectingDeviceId !== null}
                  onConnect={viewModel.onConnectDevice}
                />
              ))}
            </Box>
          ) : null}
          {viewModel.connectionErrorMessage ? (
            <Text typography="body3" lx={{ color: "error", marginTop: "s8" }}>
              {viewModel.connectionErrorMessage}
            </Text>
          ) : null}
        </Section>

        <Section
          title="Backup storage"
          subtitle="Persisted in the app storage, one backup per device model, so it survives an app restart. Pre-checks treat a present backup as RestoreBackup. Create backup only asks what to do when the backup is expired."
        >
          <StatusRow label="Backup" value={viewModel.hasBackup ? "present" : "absent"} />
          <StatusRow label="Age" value={viewModel.backupAge ?? "-"} />
          <Box lx={{ marginTop: "s8", gap: "s8" }}>
            <Button
              size="md"
              appearance="base"
              isFull
              disabled={!viewModel.deviceId || viewModel.isBusy}
              onPress={viewModel.onSeedBackup}
            >
              Seed dummy backup
            </Button>
            <Button
              size="md"
              appearance="base"
              isFull
              disabled={!viewModel.deviceId || viewModel.isBusy || !viewModel.hasBackup}
              onPress={viewModel.onRemoveBackup}
            >
              Remove backup
            </Button>
          </Box>
        </Section>

        <Section title="Run">
          <StatusRow label="Phase" value={viewModel.phase} />
          <Box lx={{ marginTop: "s8", gap: "s8" }}>
            <Button
              size="md"
              appearance="base"
              isFull
              disabled={!viewModel.canStart}
              onPress={viewModel.onStart}
            >
              Start
            </Button>
            <Button
              size="md"
              appearance="base"
              isFull
              disabled={!viewModel.canStop}
              onPress={viewModel.onStop}
            >
              Stop
            </Button>
          </Box>
          {viewModel.errorMessage ? (
            <Text typography="body3" lx={{ color: "error", marginTop: "s8" }}>
              {viewModel.errorMessage}
            </Text>
          ) : null}
        </Section>
      </ScrollView>

      <SeedBackupSheet
        isOpen={viewModel.isSeedBackupSheetOpen}
        onClose={viewModel.onCloseSeedBackupSheet}
        onSeedValidBackup={viewModel.onSeedValidBackup}
        onSeedExpiredBackup={viewModel.onSeedExpiredBackup}
      />
    </>
  );
}

function SeedBackupSheet({
  isOpen,
  onClose,
  onSeedValidBackup,
  onSeedExpiredBackup,
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onSeedValidBackup: () => void;
  onSeedExpiredBackup: () => void;
}>) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader
          title="Dummy backup age"
          description="Should the dummy backup be expired, meaning older than 24h?"
        />
        <Box lx={{ padding: "s16", gap: "s8" }}>
          <Button size="md" appearance="base" isFull onPress={onSeedExpiredBackup}>
            Expired
          </Button>
          <Button size="md" appearance="base" isFull onPress={onSeedValidBackup}>
            Not expired
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}

function Section({
  title,
  subtitle,
  children,
}: Readonly<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}>) {
  return (
    <Box
      lx={{
        padding: "s20",
        backgroundColor: "surface",
        borderRadius: "md",
        marginBottom: "s16",
      }}
    >
      <Text
        typography="heading5SemiBold"
        lx={{ color: "base", marginBottom: subtitle ? "s4" : "s16" }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text typography="body3" lx={{ color: "muted", marginBottom: "s16" }}>
          {subtitle}
        </Text>
      ) : null}
      {children}
    </Box>
  );
}

function StatusRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: "s4",
        gap: "s8",
      }}
    >
      <Text typography="body3" lx={{ color: "muted" }}>
        {label}
      </Text>
      <Text typography="body3SemiBold" lx={{ color: "base" }}>
        {value}
      </Text>
    </Box>
  );
}

function DiscoveredDeviceRow({
  device,
  disabled,
  onConnect,
}: Readonly<{
  device: DebugDiscoveredDevice;
  disabled: boolean;
  onConnect: (deviceId: string) => void;
}>) {
  const onPress = useCallback(() => onConnect(device.id), [device.id, onConnect]);

  return (
    <Button size="md" appearance="base" isFull disabled={disabled} onPress={onPress}>
      {`${device.name} · ${device.transport}`}
    </Button>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  orchestrator: { flex: 1 },
});
