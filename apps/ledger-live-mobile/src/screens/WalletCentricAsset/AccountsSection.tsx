import React, { useCallback, useMemo } from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import AccountRow from "../Accounts/AccountRow";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import { NavigatorName, ScreenName } from "../../const";
import { track } from "../../analytics";
import { AccountsNavigatorParamList } from "../../components/RootNavigator/types/AccountsNavigator";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";

const NB_MAX_ACCOUNTS_TO_DISPLAY = 3;

type Navigation = BaseComposite<
  StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Asset>
>;

type ListProps = {
  accounts: Account[] | TokenAccount[];
  currencyId: string;
  currencyTicker: string;
};

const AccountsSection = ({
  accounts,
  currencyId,
  currencyTicker,
}: ListProps) => {
  const navigation = useNavigation<Navigation["navigation"]>();
  const { t } = useTranslation();

  const accountsToDisplay = useMemo(
    () => accounts.slice(0, NB_MAX_ACCOUNTS_TO_DISPLAY),
    [accounts],
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <AccountRow
        navigation={navigation}
        account={item}
        accountId={item.id}
        isLast={index === accountsToDisplay.length - 1}
        sourceScreenName={ScreenName.Asset}
      />
    ),
    [accountsToDisplay.length, navigation],
  );

  const goToAccountsScreen = useCallback(() => {
    track("button_clicked", {
      button: "See All",
    });
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.Accounts,
      params: {
        currencyId,
        currencyTicker,
      },
    });
  }, [navigation, currencyId, currencyTicker]);

  return (
    <>
      <FlatList<Account | TokenAccount>
        data={accountsToDisplay}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ flex: 1 }}
      />
      {accounts.length > NB_MAX_ACCOUNTS_TO_DISPLAY ? (
        <Button
          type="shade"
          size="large"
          outline
          mt={6}
          onPress={goToAccountsScreen}
        >
          {t("common.seeAllWithNumber", { number: accounts.length })}
        </Button>
      ) : null}
    </>
  );
};

export default withDiscreetMode(AccountsSection);
