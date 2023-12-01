import { isSwapOperationPending } from "@ledgerhq/live-common/exchange/swap/index";
import { mappedSwapOperationsToCSV } from "@ledgerhq/live-common/exchange/swap/csvExport";
import getCompleteSwapHistory from "@ledgerhq/live-common/exchange/swap/getCompleteSwapHistory";
import updateAccountSwapStatus from "@ledgerhq/live-common/exchange/swap/updateAccountSwapStatus";
import { MappedSwapOperation, SwapHistorySection } from "@ledgerhq/live-common/exchange/swap/types";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Animated,
  ListRenderItemInfo,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import Share from "react-native-share";
import { useDispatch, useSelector } from "react-redux";
import type { Account } from "@ledgerhq/types-live";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { TrackScreen } from "~/analytics";
import Alert from "~/components/Alert";
import Button from "~/components/Button";
import LText from "~/components/LText";
import useInterval from "~/components/useInterval";
import DownloadFileIcon from "~/icons/DownloadFile";
import logger from "../../../logger";
import { flattenAccountsSelector } from "~/reducers/accounts";
import EmptyState from "./EmptyState";
import OperationRow from "./OperationRow";

// const SList : SectionList<MappedSwapOperation, SwapHistorySection> = SectionList;
const AnimatedSectionList: typeof SectionList = Animated.createAnimatedComponent(
  SectionList,
) as unknown as typeof SectionList;

const History = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const accounts = useSelector(flattenAccountsSelector);
  const dispatch = useDispatch();
  const [sections, setSections] = useState<SwapHistorySection[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setSections(getCompleteSwapHistory(accounts));
  }, [accounts, setSections]);

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

  const renderItem = ({ item }: ListRenderItemInfo<MappedSwapOperation>) => (
    <OperationRow item={item} />
  );

  const exportSwapHistory = async () => {
    const mapped = await mappedSwapOperationsToCSV(sections);
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

    try {
      await Share.open(options);
    } catch (err) {
      // `failOnCancel: false` is not enough to prevent throwing on cancel apparently ¯\_(ツ)_/¯
      if ((err as { error?: { code?: string } })?.error?.code !== "ECANCELLED500") {
        logger.critical(err as Error);
      }
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => setIsRefreshing(true)} />
        }
        ListHeaderComponent={
          sections.length ? (
            <Button
              type="tertiary"
              title={t("transfer.swap.history.exportButton")}
              containerStyle={styles.button}
              IconLeft={DownloadFileIcon}
              onPress={exportSwapHistory}
            />
          ) : null
        }
        keyExtractor={({ swapId, operation }: { swapId: string; operation?: { id: string } }) =>
          swapId + operation?.id
        }
        renderItem={renderItem}
        renderSectionHeader={({ section }: { section: SwapHistorySection }) => (
          <LText semiBold style={styles.section} color="grey">
            {section.day.toDateString()}
          </LText>
        )}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
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
});

export default History;
