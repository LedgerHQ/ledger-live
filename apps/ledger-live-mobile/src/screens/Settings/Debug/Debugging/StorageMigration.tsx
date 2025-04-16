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
import type { MigrationStatus } from "LLM/storage/utils/migrations/types";

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
        <Bullet backgroundColor={colors[MIGRATION_STATUS_COLOR[storageState.migrationStatus]]} />
        <Text variant="body">Migration:</Text>
        <Tag>{storageState.migrationStatus}</Tag>
      </Flex>
      <Flex flexDirection="row" alignItems="center" mt={4}>
        <Bullet backgroundColor={colors.grey} />
        <Text variant="body">Rollback: </Text>
        <Tag>not-started</Tag>
      </Flex>
      <Flex p={4}>
        <Flex mt={4}>
          <Text p={4}>Migrate data from AsyncStorage to MMKV</Text>
          <Button
            mt={3}
            type="main"
            disabled={storageState.migrationStatus === "completed"}
            onPress={handleMigrateBtnPress}
          >
            Migrate
          </Button>
        </Flex>
        <Flex mt={4}>
          <Text p={4}>Rollback a completed migration</Text>
          <Button mt={3} type="main" disabled={true} onPress={handleRollbackBtnPress}>
            Rollback
          </Button>
        </Flex>
        <Flex mt={4}>
          <Text p={4}>
            Reset the migration state. Use if you need to test or rerun auto-migration on next
            startup.
          </Text>
          <Button
            mt={3}
            type="main"
            disabled={storageState.migrationStatus === "not-started"}
            onPress={handleResetBtnPress}
          >
            Reset
          </Button>
        </Flex>
        <Flex mt={4}>
          <Text p={4}>Copy key value pairs from storage to clipboard as JSON</Text>
          <Button mt={3} type="main" onPress={handleCopyBtnPress}>
            Copy
          </Button>
        </Flex>
      </Flex>
    </NavigationScrollView>
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

const MIGRATION_STATUS_COLOR = {
  "not-started": "grey",
  "in-progress": "warning",
  completed: "success",
  "rolled-back": "alert",
} as const satisfies Record<MigrationStatus, keyof Theme["colors"]>;
