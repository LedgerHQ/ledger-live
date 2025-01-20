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

type AccountListDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  data: (Account | TokenAccount)[];
  onPressAccount: (account: Account | TokenAccount) => void;
};

const AccountListDrawer = ({
  isOpen,
  onClose,
  onBack,
  data,
  onPressAccount,
}: AccountListDrawerProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item: account }: ListRenderItemInfo<Account | TokenAccount>) => {
      return (
        <TouchableOpacity key={account.id} onPress={() => onPressAccount(account)}>
          <Flex flexDirection="row" alignItems="center" padding={3} width={343}>
            <AccountItem account={account} balance={account.spendableBalance} showUnit />
          </Flex>
        </TouchableOpacity>
      );
    },
    [onPressAccount],
  );

  const keyExtractor = useCallback(getAccountListKeyExtractor, []);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      onBack={onBack}
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
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          style={{ paddingHorizontal: 16 }}
          ListEmptyComponent={<AccountListEmpty />}
        />
      </Flex>
    </QueuedDrawer>
  );
};

export default AccountListDrawer;
