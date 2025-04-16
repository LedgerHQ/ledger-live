import React, { useState } from "react";
import styled from "styled-components/native";
import { useTheme } from "@react-navigation/native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Flex, Alert, Text, Tag } from "@ledgerhq/native-ui";
import NavigationScrollView from "~/components/NavigationScrollView";
import Button from "~/components/Button";
import type { Theme } from "~/colors";
import storage from "LLM/storage";
import type { StorageState } from "LLM/storage/types";
import { MIGRATION_STATUS, ROLLBACK_STATUS } from "LLM/storage/utils/migrations/constants";
import type { MigrationStatus, RollbackStatus } from "LLM/storage/utils/migrations/types";

export function DebugStorageMigration() {
  const { colors } = useTheme();
  const protectFeature = useFeature("llmMmkvMigration");
  const [storageState, setStorageState] = useState({ ...storage.getState() });

  async function handleMigrateBtnPress() {
    await storage.migrate();
    setStorageState({ ...storage.getState() });
  }

  async function handleRollbackBtnPress() {
    await storage.rollbackMigration();
    setStorageState({ ...storage.getState() });
  }

  async function handleResetBtnPress() {
    await storage.resetMigration();
    setStorageState({ ...storage.getState() });
  }

  async function handleCopyBtnPress() {
    const json = await storage.stringify();
    Clipboard.setString(json);
  }

  if (protectFeature == null || !protectFeature.enabled) {
    return null;
  }

  return (
    <NavigationScrollView>
      <Flex p={4}>
        <Alert type="info" title={`Storage type: ${storageState.storageType}`} />
      </Flex>
      <Flex flexDirection="row" alignItems="center" mt={4}>
        <Bullet backgroundColor={getMigrationStatusColor(storageState, colors)} />
        <Text variant="body">Migration:</Text>
        <Tag>{storageState.migrationStatus}</Tag>
      </Flex>
      <Flex flexDirection="row" alignItems="center" mt={4}>
        <Bullet backgroundColor={getRollbackStatusColor(storageState, colors)} />
        <Text variant="body">Rollback: </Text>
        <Tag>{storageState.rollbackStatus}</Tag>
      </Flex>
      <Flex p={4}>
        <DebugMigrationAction
          helperText="Migrate data from AsyncStorage to MMKV"
          buttonText="Migrate"
          disabled={isMigrationBtnDisabled(storageState)}
          onPress={handleMigrateBtnPress}
        />
        <DebugMigrationAction
          helperText="Rollback a completed migration. If already rolled-back use reset and re-migrate before"
          buttonText="Rollback"
          disabled={isRollbackBtnDisabled(storageState)}
          onPress={handleRollbackBtnPress}
        />
        <DebugMigrationAction
          helperText="Reset the migration state. Use if you need to test or rerun auto-migration on next startup"
          buttonText="Reset"
          disabled={isResetBtnDisabled(storageState)}
          onPress={handleResetBtnPress}
        />
        <DebugMigrationAction
          helperText="Copy key value pairs from storage to clipboard as JSON"
          buttonText="Copy"
          onPress={handleCopyBtnPress}
        />
      </Flex>
    </NavigationScrollView>
  );
}

function DebugMigrationAction({
  buttonText,
  helperText,
  disabled = false,
  onPress = () => {},
}: DebugMigrationActionProps) {
  return (
    <Flex mt={4}>
      <Text p={4}>{helperText}</Text>
      <Button mt={3} type="main" disabled={disabled} onPress={onPress}>
        {buttonText}
      </Button>
    </Flex>
  );
}

const Bullet = styled(Flex).attrs((p: { backgroundColor: string }) => ({
  backgroundColor: p.backgroundColor,
}))`
  width: 8px;
  height: 8px;
  border-radius: 8px;
  margin: 0 8px 0 32px;
`;

/**
 * Check if the migration button should be disabled. It is disabled if the migration status is either:
 *
 * - `completed`: Migration already done so no need to do it.
 * - `rolled-back`: Migration has been rolled-back so migration needs to be reset first.
 *
 * @param storageState
 * The storage state from which to evaluate migration status.
 */
function isMigrationBtnDisabled({ migrationStatus }: StorageState): boolean {
  return (
    migrationStatus === MIGRATION_STATUS.COMPLETED ||
    migrationStatus === MIGRATION_STATUS.ROLLED_BACK
  );
}

/**
 * Check if the rollback button should be disabled. It is disabled when:
 *
 * - the migration status is `not-started` and rollback status is `not-started`.
 * - the migration status is `rolled-back` and rollback status is `completed`.
 *
 * @param storageState
 * The storage state from which to evaluate migration and rollback status.
 */
function isRollbackBtnDisabled({ migrationStatus, rollbackStatus }: StorageState): boolean {
  return (
    (migrationStatus === MIGRATION_STATUS.NOT_STARTED &&
      rollbackStatus === ROLLBACK_STATUS.NOT_STARTED) ||
    (migrationStatus === MIGRATION_STATUS.ROLLED_BACK &&
      rollbackStatus === ROLLBACK_STATUS.COMPLETED)
  );
}

/**
 * Check if the reset button should be disabled.
 *
 * @param storageState
 * The storage state from which to evaluate migration status.
 */
function isResetBtnDisabled({ migrationStatus }: StorageState): boolean {
  return migrationStatus === MIGRATION_STATUS.NOT_STARTED;
}

/**
 * Gets the color for the migration status.
 *
 * @param storageState
 * The storage state from which to evaluate migartion status.
 *
 * @param colors
 * The current theme colors.
 */
function getMigrationStatusColor({ migrationStatus }: StorageState, colors: Colors): string {
  return colors[MIGRATION_STATUS_COLOR[migrationStatus]];
}

/**
 * Gets the color for the rollback status.
 *
 * @param storageState
 * The storage state from which to evaluate rollback status.
 *
 * @param colors
 * The current theme colors.
 */
function getRollbackStatusColor({ rollbackStatus }: StorageState, colors: Colors): string {
  return colors[ROLLBACK_STATUS_COLOR[rollbackStatus]];
}

/** Migration status color mapping */
const MIGRATION_STATUS_COLOR = {
  "not-started": "grey",
  "in-progress": "warning",
  completed: "success",
  "rolled-back": "alert",
} as const satisfies Record<MigrationStatus, keyof Theme["colors"]>;

/** Rollback status color mapping */
const ROLLBACK_STATUS_COLOR = {
  "not-started": "grey",
  "in-progress": "warning",
  completed: "success",
} as const satisfies Record<RollbackStatus, keyof Theme["colors"]>;

/** Props for the {@link DebugMigrationButton} component */
interface DebugMigrationActionProps {
  buttonText: string;
  helperText: string;
  disabled?: boolean;
  onPress?: () => void;
}

/** Represents all available Theme colors */
type Colors = Theme["colors"];
