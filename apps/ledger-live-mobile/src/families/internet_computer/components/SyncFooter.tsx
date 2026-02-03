import { Button, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { formatLastSyncDate } from "../utils";

type Props = {
  lastUpdatedMSecs: number | undefined;
  onSync: () => void;
  onClose?: () => void;
};

export default function SyncFooter({ lastUpdatedMSecs, onSync, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Text variant="small" color="neutral.c60" style={styles.lastSync}>
        <Trans i18nKey="icp.neuronManage.list.lastSync" />:{" "}
        {formatLastSyncDate(lastUpdatedMSecs, t("icp.neuronManage.list.lastSyncNever"))}
      </Text>
      <Button type="main" onPress={onSync} mb={3}>
        <Trans i18nKey="icp.neuronManage.list.sync" />
      </Button>
      {onClose && (
        <Button type={"default"} onPress={onClose}>
          <Trans i18nKey="common.close" />
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  lastSync: {
    paddingBottom: 8,
    textAlign: "center",
  },
});
