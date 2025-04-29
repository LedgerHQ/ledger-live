import React, { useCallback } from "react";
import { Operation, DailyOperationsSection } from "@ledgerhq/types-live";
import { Button } from "@ledgerhq/native-ui";
import { SectionListRenderItemInfo, SectionList } from "react-native";
import SectionHeader from "~/components/SectionHeader";
import { ViewProps } from "./types";
import { useTranslation } from "react-i18next";
import { flattenAccounts } from "@ledgerhq/coin-framework/lib/account/helpers";
import { OperationRowContainer } from "./OperationRowContainer";

const keyExtractor = (operation: Operation) => operation.id;

const renderSectionHeader = ({ section }: { section: { day: Date } }) => {
  return <SectionHeader day={section.day} />;
};

export function OperationsHistoryList({
  accounts,
  testID,
  sections,
  completed,
  goToAnalyticsOperations,
}: ViewProps) {
  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item, index, section }: SectionListRenderItemInfo<Operation, DailyOperationsSection>) => {
      const flattenedAccounts = flattenAccounts(accounts);
      const account = flattenedAccounts.find(a => a.id === item.accountId);

      if (!account) return null;

      return (
        <OperationRowContainer
          operation={item}
          account={account}
          multipleAccounts={flattenedAccounts.length > 1}
          isLast={section.data.length - 1 === index}
        />
      );
    },
    [accounts],
  );

  if (!sections) return null;

  return (
    <>
      <SectionList
        sections={sections}
        contentContainerStyle={{ flexGrow: 1 }}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        testID={testID}
      />
      {!completed ? (
        <Button
          type="shade"
          size="large"
          outline
          mt={6}
          onPress={goToAnalyticsOperations}
          testID="portfolio-seeAll-transaction"
        >
          {t("common.seeAll")}
        </Button>
      ) : null}
    </>
  );
}
