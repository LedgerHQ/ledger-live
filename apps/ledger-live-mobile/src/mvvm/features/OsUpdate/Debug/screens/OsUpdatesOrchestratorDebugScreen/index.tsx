import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import {
  CreateBackupStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  type CreateBackupState,
  type OsUpdatesProgress,
  type PreChecksState,
} from "@ledgerhq/live-dmk-shared";
import { useOsUpdatesOrchestratorDebugScreenViewModel } from "./useOsUpdatesOrchestratorDebugScreenViewModel";
import type { ProgressHistoryEntry } from "./types";

export default function OsUpdatesOrchestratorDebugScreen() {
  const viewModel = useOsUpdatesOrchestratorDebugScreenViewModel();

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section
          title="Device"
          subtitle="Connect a device first (My Ledger or Connect Device playground)."
        >
          <StatusRow label="DMK" value={viewModel.dmkReady ? "ready" : "unavailable"} />
          <StatusRow label="Device id" value={viewModel.deviceId ?? "-"} />
          <StatusRow label="Session id" value={viewModel.sessionId ?? "-"} />
          <StatusRow
            label="Device status"
            value={viewModel.deviceStatus != null ? String(viewModel.deviceStatus) : "-"}
          />
        </Section>

        <Section
          title="Backup storage"
          subtitle="In-memory only. Pre-checks treat a present backup as RestoreBackup. Create backup only asks what to do when the backup is expired."
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

        <Section title="Orchestrator progress">
          <StatusRow label="Step" value={viewModel.progress?.step ?? "-"} />
          <StatusRow label="State" value={viewModel.progress?.state.type ?? "-"} />
          {viewModel.progress ? <StepActions progress={viewModel.progress} /> : null}
          <Text typography="body3" lx={{ color: "muted", marginTop: "s8" }}>
            {formatProgress(viewModel.progress)}
          </Text>
        </Section>

        <Section title="History">
          {viewModel.history.length === 0 ? (
            <Text typography="body3" lx={{ color: "muted" }}>
              No progress emitted yet.
            </Text>
          ) : (
            viewModel.history.map(entry => <HistoryRow key={entry.id} entry={entry} />)
          )}
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

function HistoryRow({ entry }: Readonly<{ entry: ProgressHistoryEntry }>) {
  return (
    <Box lx={{ paddingVertical: "s4" }}>
      <Text typography="body3SemiBold" lx={{ color: "base" }}>
        {entry.time} · {entry.step}
      </Text>
      <Text typography="body3" lx={{ color: "muted" }}>
        {entry.stateType}
      </Text>
    </Box>
  );
}

function StepActions({ progress }: Readonly<{ progress: OsUpdatesProgress }>) {
  switch (progress.step) {
    case OsUpdatesSteps.PRE_CHECKS:
      return <PreChecksActions state={progress.state} />;
    case OsUpdatesSteps.CREATE_BACKUP:
      return <CreateBackupActions state={progress.state} />;
    default: {
      const unhandled: never = progress;
      return unhandled;
    }
  }
}

function PreChecksActions({ state }: Readonly<{ state: PreChecksState }>) {
  switch (state.type) {
    case PreChecksStateType.BATTERY_TOO_LOW:
    case PreChecksStateType.UNEXPECTED_ERROR:
      return <Actions actions={[{ label: "Cancel", onPress: state.cancel }]} />;
    case PreChecksStateType.LOADING:
    case PreChecksStateType.DEVICE_LOCKED:
    case PreChecksStateType.DEVICE_DISCONNECTED:
      return null;
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

function CreateBackupActions({ state }: Readonly<{ state: CreateBackupState }>) {
  switch (state.type) {
    case CreateBackupStateType.AWAITING_BACKUP_SELECTION:
      return (
        <Actions
          actions={[
            { label: "Use existing backup", onPress: state.useExistingBackup },
            { label: "Create a new backup", onPress: state.createNewBackup },
          ]}
        />
      );
    case CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED:
      return (
        <Actions
          actions={[
            { label: "Retry", onPress: state.retry },
            { label: "Cancel", onPress: state.cancel },
          ]}
        />
      );
    case CreateBackupStateType.UNEXPECTED_ERROR:
      return <Actions actions={[{ label: "Cancel", onPress: state.cancel }]} />;
    case CreateBackupStateType.LOADING:
    case CreateBackupStateType.DEVICE_LOCKED:
    case CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION:
    case CreateBackupStateType.DEVICE_DISCONNECTED:
      return null;
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

function Actions({
  actions,
}: Readonly<{ actions: Array<{ label: string; onPress: () => void }> }>) {
  return (
    <Box lx={{ marginTop: "s8", gap: "s8" }}>
      {actions.map(({ label, onPress }) => (
        <Button key={label} size="md" appearance="base" isFull onPress={onPress}>
          {label}
        </Button>
      ))}
    </Box>
  );
}

function formatProgress(progress: OsUpdatesProgress | null): string {
  if (!progress) {
    return "No progress yet.";
  }
  return JSON.stringify(
    progress,
    (_key, value) => (typeof value === "function" ? "[Function]" : value),
    2,
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});
