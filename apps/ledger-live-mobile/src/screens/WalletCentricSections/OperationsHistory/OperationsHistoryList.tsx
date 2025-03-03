import React, { useCallback } from "react";
import { Operation, DailyOperationsSection, SubAccount } from "@ledgerhq/types-live";
import { Button } from "@ledgerhq/native-ui";
import { SectionListRenderItemInfo, SectionList } from "react-native";

import { useSelector } from "react-redux";
import OperationRow from "~/components/OperationRow";
import { parentAccountSelector } from "~/reducers/accounts";
import SectionHeader from "~/components/SectionHeader";
import { State } from "~/reducers/types";
import { ViewProps } from "./types";
import { useTranslation } from "react-i18next";

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
      const account = accounts.find(a => a.id === item.accountId) as SubAccount;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const parentAccount = useSelector((state: State) =>
        parentAccountSelector(state, { account }),
      );

      if (!account) return null;

      return (
        <OperationRow
          operation={item}
          parentAccount={parentAccount}
          account={account}
          multipleAccounts={accounts.length > 1}
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
