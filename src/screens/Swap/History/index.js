import React, {
  useCallback,
  useRef,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  Animated,
  SectionList,
  RefreshControl,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Share from "react-native-share";
import { useTheme } from "@react-navigation/native";
import getCompleteSwapHistory from "@ledgerhq/live-common/lib/exchange/swap/getCompleteSwapHistory";
import updateAccountSwapStatus from "@ledgerhq/live-common/lib/exchange/swap/updateAccountSwapStatus";
import { mappedSwapOperationsToCSV } from "@ledgerhq/live-common/lib/exchange/swap/csvExport";
import { operationStatusList } from "@ledgerhq/live-common/lib/exchange/swap";
import useInterval from "../../../components/useInterval";
import { updateAccountWithUpdater } from "../../../actions/accounts";
import { flattenAccountsSelector } from "../../../reducers/accounts";
import OperationRow from "./OperationRow";
import EmptyState from "./EmptyState";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import logger from "../../../logger";
import DownloadFileIcon from "../../../icons/DownloadFile";
import { TrackScreen } from "../../../analytics";

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

const History = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const accounts = useSelector(flattenAccountsSelector);
  const dispatch = useDispatch();
  const [sections, setSections] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const ref = useRef();

  useEffect(() => {
    setSections(getCompleteSwapHistory(accounts));
  }, [accounts, setSections]);

  useEffect(() => {
    if (isRefreshing) {
      updateSwapStatus();
    }
  }, [isRefreshing, updateSwapStatus]);

  const updateSwapStatus = useCallback(() => {
    let cancelled = false;
    async function fetchUpdatedSwapStatus() {
      const updatedAccounts = await Promise.all(
        accounts.map(updateAccountSwapStatus),
      );
      if (!cancelled) {
        updatedAccounts.filter(Boolean).forEach(account => {
          dispatch(updateAccountWithUpdater(account.id, _ => account));
        });
      }
      setIsRefreshing(false);
    }

    fetchUpdatedSwapStatus();
    return () => (cancelled = true);
  }, [accounts, dispatch]);

  const hasPendingSwapOperations = useMemo(() => {
    if (sections) {
      for (const section of sections) {
        for (const swapOperation of section.data) {
          if (operationStatusList.pending.includes(swapOperation.status)) {
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

  const renderItem = ({ item }: { item: Operation }) => (
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
      if (err.error.code !== "ECANCELLED500") {
        logger.critical(err);
      }
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="Swap" name="History" />
      <AnimatedSectionList
        ref={ref}
        sections={sections}
        style={styles.sectionList}
        contentContainerStyle={styles.contentContainer}
        ListEmptyComponent={_ => <EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => setIsRefreshing(true)}
          />
        }
        ListHeaderComponent={
          sections.length && (
            <Button
              type="tertiary"
              title={t("transfer.swap.history.exportButton")}
              containerStyle={styles.button}
              IconLeft={DownloadFileIcon}
              onPress={exportSwapHistory}
            />
          )
        }
        keyExtractor={({ swapId }) => swapId}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
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
});

export default History;
