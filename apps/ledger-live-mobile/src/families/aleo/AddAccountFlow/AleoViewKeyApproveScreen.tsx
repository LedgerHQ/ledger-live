import React, { useCallback, useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { Alert, Icons, InfiniteLoader } from "@ledgerhq/native-ui";
import type { Account } from "@ledgerhq/types-live";
import { useTheme } from "styled-components/native";
import connectAppFactory from "@ledgerhq/live-common/hw/connectApp";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  createAction,
  getViewKeyExec,
  type Request,
} from "@ledgerhq/live-common/families/aleo/hw/getViewKey/index";
import { ScreenName } from "~/const";
import LText from "~/components/LText";
import Animation from "~/components/Animation";
import Button from "~/components/wrappedUi/Button";
import { DeviceActionDefaultRendering } from "~/components/DeviceAction";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { Trans, useTranslation } from "~/context/Locale";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { useAccountName } from "~/reducers/wallet";
import type { AleoViewKeyFlowParamList } from "./types";

type Props = StackNavigatorProps<AleoViewKeyFlowParamList, ScreenName.AleoViewKeyApprove>;

function AccountStatusLabel({
  account,
  fallbackLabel,
}: {
  account: Account;
  fallbackLabel: string;
}) {
  const accountName = useAccountName(account);

  return (
    <LText numberOfLines={1} style={styles.accountLabel} color="neutral.c80">
      {accountName || fallbackLabel}
    </LText>
  );
}

export default function AleoViewKeyApproveScreen({ route }: Props) {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;

  const action = useMemo(
    () => createAction(connectAppFactory({ isLdmkConnectAppEnabled }), getViewKeyExec),
    [isLdmkConnectAppEnabled],
  );

  const request = useMemo<Request>(
    () => ({
      appName: "Aleo",
      selectedAccounts: route.params.accountsToAdd,
      currency: route.params.currency.type === "CryptoCurrency" ? route.params.currency : undefined,
    }),
    [route.params.accountsToAdd, route.params.currency],
  );

  const hookState = action.useHook(route.params.device, request);
  const payload = action.mapResult(hookState);

  const confirmedAccountIds = useMemo(() => {
    const confirmed = new Set<string>();

    Object.entries(hookState.shareProgress.viewKeys).forEach(([accountId, viewKey]) => {
      if (viewKey) {
        confirmed.add(accountId);
      }
    });

    return confirmed;
  }, [hookState.shareProgress.viewKeys]);

  const rejectedAccountIds = useMemo(() => {
    const rejected = new Set<string>();

    Object.entries(hookState.shareProgress.viewKeys).forEach(([accountId, viewKey]) => {
      if (viewKey === null) {
        rejected.add(accountId);
      }
    });

    return rejected;
  }, [hookState.shareProgress.viewKeys]);

  const onResult = useCallback(() => {
    route.params.onConfirmImport(payload ?? undefined);
  }, [payload, route.params]);

  const getAccountStatusIcon = useCallback(
    (index: number, accountId: string) => {
      if (index === hookState.shareProgress.completed && hookState.sharePending) {
        return <InfiniteLoader size={14} />;
      }

      if (confirmedAccountIds.has(accountId)) {
        return <Icons.Check size="S" color="neutral.c60" />;
      }

      if (rejectedAccountIds.has(accountId)) {
        return <Icons.Close size="S" color="neutral.c60" />;
      }

      return <Icons.Refresh size="S" color="neutral.c60" />;
    },
    [
      confirmedAccountIds,
      hookState.sharePending,
      hookState.shareProgress.completed,
      rejectedAccountIds,
    ],
  );

  const onCancel = useCallback(() => {
    route.params.onCancelFlow();
  }, [route.params]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background.main }]}>
      <DeviceActionDefaultRendering
        status={hookState}
        request={request}
        payload={payload}
        device={route.params.device}
        onResult={onResult}
      />

      {hookState.sharePending ? (
        <View style={[styles.overlay, { backgroundColor: colors.background.main }]}>
          <ScrollView style={styles.list} contentContainerStyle={styles.contentContainer}>
            <View style={styles.animationContainer}>
              <Animation
                source={getDeviceAnimation({
                  modelId: route.params.device.modelId,
                  key: "verify",
                  theme,
                })}
                style={getDeviceAnimationStyles(route.params.device.modelId)}
              />
            </View>
            <LText semiBold style={styles.title} color="neutral.c100">
              <Trans i18nKey="aleo.addAccount.stepViewKeyApprove.title" />
            </LText>
            <LText style={styles.description} color="neutral.c100">
              <Trans i18nKey="aleo.addAccount.stepViewKeyApprove.description" />
            </LText>

            <View style={styles.listContent}>
              {route.params.accountsToAdd.map((account, index) => (
                <View
                  style={[styles.row, { backgroundColor: colors.opacityDefault.c05 }]}
                  key={account.id}
                >
                  <AccountStatusLabel account={account} fallbackLabel={account.freshAddress} />
                  <View style={styles.statusIcon}>{getAccountStatusIcon(index, account.id)}</View>
                </View>
              ))}
            </View>

            <Alert type="info">
              <Alert.BodyText>
                <Trans i18nKey="aleo.addAccount.stepViewKeyApprove.cancelAlert" />
              </Alert.BodyText>
            </Alert>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              type="main"
              outline
              onPress={onCancel}
              event="AleoAddAccountViewKeyApproveCancelAll"
            >
              {t("aleo.addAccount.stepViewKeyApprove.cancelAllBtn", {
                count: route.params.accountsToAdd.length,
              })}
            </Button>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 128,
  },
  animationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    minHeight: 120,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    rowGap: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  accountLabel: {
    flex: 1,
    marginRight: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  statusIcon: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40,
  },
});
