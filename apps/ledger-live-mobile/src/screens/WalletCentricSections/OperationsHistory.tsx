import React, { memo, useCallback } from "react";
import { SectionList, SectionListRenderItemInfo } from "react-native";
import { Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import {
  AccountLikeArray,
  DailyOperationsSection,
  Operation,
  SubAccount,
} from "@ledgerhq/types-live";
import OperationRow from "~/components/OperationRow";
import SectionHeader from "~/components/SectionHeader";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { ScreenName } from "~/const";
import { parentAccountSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { State } from "~/reducers/types";
import { useOperations } from "../Analytics/Operations/useOperations";

type Props = {
  accounts: AccountLikeArray;
  testID?: string;
};

const NB_OPERATIONS_TO_DISPLAY = 3;

const keyExtractor = (operation: Operation) => operation.id;

const renderSectionHeader = ({ section }: { section: { day: Date } }) => {
  return <SectionHeader day={section.day} />;
};

const OperationsHistory = ({ accounts, testID }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { sections, completed } = useOperations({
    accounts,
    opCount: NB_OPERATIONS_TO_DISPLAY,
    withSubAccounts: true,
  });
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

  const goToAnalyticsOperations = useCallback(() => {
    track("button_clicked", {
      button: "See All Transactions",
    });
    navigation.navigate(ScreenName.AnalyticsOperations, {
      accountsIds: accounts.map(account => account.id),
    });
  }, [navigation, accounts]);
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
};

export default withDiscreetMode(memo<Props>(OperationsHistory));
