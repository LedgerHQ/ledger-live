import React, { useState } from "react";
import styled from "styled-components/native";
import { useTheme } from "@react-navigation/native";
import { copyToClipboard } from "@shared/clipboard";
import { Flex, Alert, Text, Tag } from "@ledgerhq/native-ui";
import NavigationScrollView from "~/components/NavigationScrollView";
import Button from "~/components/Button";
import type { Theme } from "~/colors";
import storage from "LLM/storage";
import type { StorageState } from "LLM/storage/types";
import { MIGRATION_STATUS } from "LLM/storage/utils/migrations/constants";
import type { MigrationStatus } from "LLM/storage/utils/migrations/types";
import { rejectWithError } from "LLM/utils/rejectWithError";

export function DebugStorageMigration() {
  const { colors } = useTheme();
  const [storageState, setStorageState] = useState({ ...storage.getState() });

  async function handleMigrateBtnPress() {
    await storage.migrate();
    setStorageState({ ...storage.getState() });
  }

  async function handleResetBtnPress() {
    await storage.resetMigration();
    setStorageState({ ...storage.getState() });
  }

  async function handleTriggerErrorBtnPress() {
    const usedError = new Error("Debug Storage Error");
    await storage.incrementNumberOfErrorsDebug(usedError);
    setStorageState({ ...storage.getState() });
    return rejectWithError({ e: usedError, extraData: { itsforTesting: "test" } });
  }

  async function handleCopyBtnPress() {
    const json = await storage.stringify();
    await copyToClipboard(json);
  }

  return (
    <NavigationScrollView style={{ flex: 1, marginBottom: 16 }}>
      <Flex p={4}>
        <Alert
          type="info"
          title={`Storage type: ${storageState.storageType} and ${storageState.numberOfReadErrors} error${
            storageState.numberOfReadErrors > 1 ? "s" : ""
          }`}
        />
      </Flex>
      <Flex flexDirection="row" alignItems="center" mt={4}>
        <Bullet backgroundColor={getMigrationStatusColor(storageState, colors)} />
        <Text variant="body">Migration:</Text>
        <Tag>{storageState.migrationStatus}</Tag>
      </Flex>
      <Flex py={4} mx={6}>
        <DebugMigrationAction
          helperText="Migrate data from AsyncStorage to MMKV"
          buttonText="Migrate"
          disabled={isMigrationBtnDisabled(storageState)}
          onPress={handleMigrateBtnPress}
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
        <DebugMigrationAction
          helperText="Trigger an error to test error handling"
          buttonText="Trigger an error"
          onPress={handleTriggerErrorBtnPress}
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

type BulletProps = {
  backgroundColor: string;
};

const Bullet = styled(Flex).attrs<BulletProps>(p => ({
  backgroundColor: p.backgroundColor,
}))`
  width: 8px;
  height: 8px;
  border-radius: 8px;
  margin: 0 8px 0 32px;
`;

/**
 * Check if the migration button should be disabled. It is disabled if the migration status is `completed`.
 *
 * @param storageState
 * The storage state from which to evaluate migration status.
 */
function isMigrationBtnDisabled({ migrationStatus }: StorageState): boolean {
  return migrationStatus === MIGRATION_STATUS.COMPLETED;
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

/** Migration status color mapping */
const MIGRATION_STATUS_COLOR = {
  "not-started": "grey",
  "in-progress": "warning",
  completed: "success",
} as const satisfies Record<MigrationStatus, keyof Theme["colors"]>;

/** Props for the {@link DebugMigrationButton} component */
interface DebugMigrationActionProps {
  buttonText: string;
  helperText: string;
  disabled?: boolean;
  onPress?: () => void;
}

/** Represents all available Theme colors */
type Colors = Theme["colors"];
