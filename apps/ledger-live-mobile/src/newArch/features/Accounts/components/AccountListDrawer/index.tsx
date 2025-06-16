import React, { useCallback } from "react";
import QueuedDrawer from "~/components/QueuedDrawer";
import { Flex } from "@ledgerhq/native-ui";
import { FlatList, ListRenderItemInfo, TouchableOpacity, View } from "react-native";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import AccountItem from "../AccountsListView/components/AccountItem";
import CustomHeader from "./CustomHeader";
import { useTheme } from "styled-components/native";
import getAccountListKeyExtractor from "../../utils/getAccountListKeyExtractor";
import AccountListEmpty from "../AccountListEmpty";
import { useTranslation } from "react-i18next";
import { TrackScreen } from "~/analytics";
import useAnalytics from "LLM/hooks/useAnalytics";
import { AnalyticContexts } from "LLM/hooks/useAnalytics/enums";

type AccountListDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  data: (Account | TokenAccount)[];
  onPressAccount: (account: Account | TokenAccount) => void;
  sourceScreenName?: string;
};

const AccountListDrawer = ({
  isOpen,
  onClose,
  data,
  onPressAccount,
  sourceScreenName,
}: AccountListDrawerProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { analyticsMetadata } = useAnalytics(AnalyticContexts.AddAccounts, sourceScreenName);

  const renderItem = useCallback(
    ({ item: account }: ListRenderItemInfo<Account | TokenAccount>) => {
      return (
        <TouchableOpacity key={account.id} onPress={() => onPressAccount(account)}>
          <Flex flexDirection="row" alignItems="center" padding={3}>
            <AccountItem account={account} balance={account.balance} showUnit />
          </Flex>
        </TouchableOpacity>
      );
    },
    [onPressAccount],
  );

  const keyExtractor = useCallback(getAccountListKeyExtractor, []);

  const pageTrackingEvent = analyticsMetadata.AddFunds?.onAccessScreen;

  return (
    <>
      {isOpen && (
        <TrackScreen name={pageTrackingEvent?.eventName} {...pageTrackingEvent?.payload} />
      )}
      <QueuedDrawer
        isRequestingToBeOpened={isOpen}
        onClose={onClose}
        CustomHeader={() => (
          <CustomHeader
            onClose={onClose}
            backgroundColor={colors.opacityDefault.c10}
            iconColor={colors.neutral.c100}
            title={t("addAccounts.chooseAccountToFund")}
          />
        )}
      >
        <Flex justifyContent="center" alignItems="centers" width="100%">
          <FlatList
            testID="added-accounts-list"
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            style={{ width: "100%" }}
            ListEmptyComponent={<AccountListEmpty />}
          />
        </Flex>
      </QueuedDrawer>
    </>
  );
};

export default AccountListDrawer;
