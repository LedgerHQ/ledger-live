import React, { useRef, useEffect, useState } from "react";
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
import getCompleteSwapHistory from "@ledgerhq/live-common/lib/swap/getCompleteSwapHistory";
import updateAccountSwapStatus from "@ledgerhq/live-common/lib/swap/updateAccountSwapStatus";
import { mappedSwapOperationsToCSV } from "@ledgerhq/live-common/lib/swap/csvExport";
import { updateAccountWithUpdater } from "../../../actions/accounts";
import { flattenAccountsSelector } from "../../../reducers/accounts";
import OperationRow from "./OperationRow";
import EmptyState from "./EmptyState";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import colors from "../../../colors";
import logger from "../../../logger";
import DownloadFileIcon from "../../../icons/DownloadFile";

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

const History = () => {
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
    let cancelled = false;
    async function asyncUpdateAccountSwapStatus() {
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

    if (isRefreshing) {
      asyncUpdateAccountSwapStatus();
    }

    return () => {
      cancelled = true;
    };
  }, [isRefreshing, dispatch, accounts]);

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
    <View style={styles.root}>
      <AnimatedSectionList
        ref={ref}
        sections={sections}
        style={styles.sectionList}
        contentContainerStyle={styles.contentContainer}
        ListEmptyComponent={_ => {
          return <EmptyState />;
        }}
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
        renderSectionHeader={({ section }) => {
          return (
            <LText semiBold style={styles.section}>
              {section.day.toDateString()}
            </LText>
          );
        }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "column",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 19,
    color: colors.grey,
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
