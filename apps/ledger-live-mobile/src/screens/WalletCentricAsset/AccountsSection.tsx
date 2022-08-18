import React, { useCallback, useMemo } from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AccountRow from "../Accounts/AccountRow";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import { Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { NavigatorName, ScreenName } from "../../const";

const NB_MAX_ACCOUNTS_TO_DISPLAY: number = 3;

type ListProps = {
  accounts: any;
  currencyId: string;
  currencyTicker: string;
};

const AccountsSection = ({
  accounts,
  currencyId,
  currencyTicker,
}: ListProps) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <AccountRow navigation={navigation} account={item} accountId={item.id} />
    ),
    [navigation],
  );

  const accountsToDisplay = useMemo(
    () => accounts.slice(0, NB_MAX_ACCOUNTS_TO_DISPLAY),
    [accounts],
  );

  const goToAccountsScreen = useCallback(() => {
    navigation.navigate(NavigatorName.Portfolio, {
      screen: NavigatorName.PortfolioAccounts,
      params: {
        screen: ScreenName.Accounts,
        params: {
          currencyId,
          currencyTicker,
        },
      },
    });
  }, [navigation, currencyId, currencyTicker]);

  return (
    <>
      <FlatList
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
