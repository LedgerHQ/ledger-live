import { mappedSwapOperationsToCSV } from "@ledgerhq/live-common/exchange/swap/csvExport";
import getCompleteSwapHistory from "@ledgerhq/live-common/exchange/swap/getCompleteSwapHistory";
import { isSwapOperationPending } from "@ledgerhq/live-common/exchange/swap/index";
import { MappedSwapOperation, SwapHistorySection } from "@ledgerhq/live-common/exchange/swap/types";
import updateAccountSwapStatus from "@ledgerhq/live-common/exchange/swap/updateAccountSwapStatus";
import { getParentAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Animated,
  Linking,
  ListRenderItemInfo,
  RefreshControl,
  SectionList,
  StyleSheet,
  Pressable,
  View,
} from "react-native";
import Share from "react-native-share";
import { useDispatch, useSelector } from "react-redux";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { track, TrackScreen } from "~/analytics";
import Alert from "~/components/Alert";
import Button from "~/components/Button";
import LText from "~/components/LText";
import useInterval from "~/components/useInterval";
import DownloadFileIcon from "~/icons/DownloadFile";
import { flattenAccountsSelector } from "~/reducers/accounts";
import logger from "../../../logger";
import { useSyncAllAccounts } from "../LiveApp/hooks/useSyncAllAccounts";
import EmptyState from "./EmptyState";
import OperationRow from "./OperationRow";
import { getEnv } from "@ledgerhq/live-env";
import { sendFile } from "../../../../e2e/bridge/client";
import { Text } from "react-native";
import ExternalLink from "@ledgerhq/icons-ui/native/ExternalLink";
import SafeAreaView from "~/components/SafeAreaView";

// const SList : SectionList<MappedSwapOperation, SwapHistorySection> = SectionList;
const AnimatedSectionList: typeof SectionList = Animated.createAnimatedComponent(
  SectionList,
) as unknown as typeof SectionList;

// Helper function to ensure parent account is set for token accounts
const ensureParentAccount = (
  item: MappedSwapOperation,
  accounts: AccountLike[],
): MappedSwapOperation => {
  if (item.toAccount.type === "TokenAccount" && !item.toParentAccount) {
    return {
      ...item,
      toParentAccount: getParentAccount(item.toAccount, accounts),
    };
  }
  return item;
};

const History = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const accounts = useSelector(flattenAccountsSelector);
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const ref = useRef(null);
  const syncAccounts = useSyncAllAccounts();

  // fix token account parent
  const [sections, setSections] = useState<SwapHistorySection[]>([]);

  useEffect(() => {
    async function loadHistory() {
      const history = await getCompleteSwapHistory(accounts);
      const processedSections = history.map(section => ({
        ...section,
        data: section.data.map(item => ensureParentAccount(item, accounts)),
      }));
      setSections(processedSections);
    }
    loadHistory();
  }, [accounts]);

  const refreshSwapHistory = useCallback(() => {
    syncAccounts();
    setIsRefreshing(true);
    track("buttonClicked", { button: "pull to refresh" });
  }, [syncAccounts]);

  const updateSwapStatus = useCallback(() => {
    let cancelled = false;
    async function fetchUpdatedSwapStatus() {
      const updatedAccounts = await Promise.all(
        accounts.map(account => updateAccountSwapStatus(account as Account)),
      );
      if (!cancelled) {
        updatedAccounts.filter(Boolean).forEach(account => {
          if (account)
            dispatch(
              updateAccountWithUpdater({
                accountId: account.id,
                updater: _ => account,
              }),
            );
        });
      }
      setIsRefreshing(false);
    }

    fetchUpdatedSwapStatus();
    return () => (cancelled = true);
  }, [accounts, dispatch]);

  useEffect(() => {
    if (isRefreshing) {
      updateSwapStatus();
    }
  }, [isRefreshing, updateSwapStatus]);

  const hasPendingSwapOperations = useMemo(() => {
    if (sections) {
      for (const section of sections) {
        for (const swapOperation of section.data) {
          if (isSwapOperationPending(swapOperation.status)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [sections]);

  useInterval(() => {
    if (hasPendingSwapOperations) {
      updateSwapStatus();
    }
  }, 10000);

  const renderItem = ({ item }: { item: MappedSwapOperation }) => (
    <OperationRow item={item} />
  );

  const exportSwapHistory = async () => {
    const mapped = mappedSwapOperationsToCSV(sections);
    if (!getEnv("DETOX")) {
      try {
        const base64 = Buffer.from(mapped).toString("base64");
        const options = {
          title: t("transfer.swap.history.exportButton"),
          message: t("transfer.swap.history.exportButton"),
          failOnCancel: false,
          saveToFiles: true,
          type: "text/csv",
          filename: t("transfer.swap.history.exportFilename"),
          url: `data:text/csv;base64,${base64}`,
        };

        await Share.open(options);
      } catch (err) {
        // `failOnCancel: false` is not enough to prevent throwing on cancel apparently ¯\_(ツ)_/¯
        if ((err as { error?: { code?: string } })?.error?.code !== "ECANCELLED500") {
          logger.critical(err as Error);
        }
      }
    } else {
      try {
        sendFile({ fileName: "ledgerwallet-swap-history.csv", fileContent: mapped });
      } catch (err) {
        logger.critical(err as Error);
      }
    }
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      isFlex
      edges={["bottom"]}
    >
      <TrackScreen category="Swap" name="Device History" />
      {sections.length ? (
        <View style={styles.alertWrapper}>
          <Alert type="primary">
            <Trans i18nKey="transfer.swap.history.disclaimer" />
          </Alert>
        </View>
      ) : null}
      <AnimatedSectionList
        ref={ref}
        sections={sections}
        style={styles.sectionList}
        contentContainerStyle={styles.contentContainer}
        ListEmptyComponent={_ => <EmptyState />}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshSwapHistory} />}
        ListHeaderComponent={
          sections.length ? (
            <Button
              type="tertiary"
              title={t("transfer.swap.history.exportButton")}
              containerStyle={styles.button}
              IconLeft={DownloadFileIcon}
              onPress={exportSwapHistory}
              testID="export-swap-operations-link"
            />
          ) : null
        }
        keyExtractor={({ swapId, operation }: { swapId: string; operation?: { id: string } }) =>
          swapId + operation?.id
        }
        // @ts-ignore AnimatedSectionList type inference issue
        renderItem={renderItem}
        renderSectionHeader={({ section }: { section: SwapHistorySection }) => (
          <LText semiBold style={styles.section} color="grey">
            {section.day.toDateString()}
          </LText>
        )}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
      <View style={styles.feedbackContainer}>
        <Pressable
          onPress={() =>
            Linking.openURL(
              "https://form.typeform.com/to/FIHc3fk2?typeform-source=ledger.typeform.com#source=mobile",
            )
          }
          style={styles.feedbackRow}
        >
          <Text style={[styles.feedbackLink, { color: colors.grey }]}>
            <Trans i18nKey="transfer.swap.history.feedback" />
          </Text>
          <ExternalLink size="S" color={colors.grey} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "column",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 19,
  },
  sectionList: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 64,
    flexGrow: 1,
  },
  button: {
    margin: 16,
  },
  alertWrapper: {
    padding: 20,
  },
  feedbackContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedbackLink: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default History;
