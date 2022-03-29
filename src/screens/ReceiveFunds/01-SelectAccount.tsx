import React, { useCallback, useMemo } from "react";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
import {
  accountWithMandatoryTokens,
  flattenAccounts,
} from "@ledgerhq/live-common/lib/account/helpers";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { Flex } from "@ledgerhq/native-ui";

import { accountsSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import KeyboardView from "../../components/KeyboardView";
import AccountSelector from "../../components/AccountSelector";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any;
  route: {
    params?: {
      currency?: string;
      selectedCurrency?: CryptoCurrency | TokenCurrency;
    };
  };
};

export default function ReceiveFunds({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { selectedCurrency, currency: initialCurrencySelected } =
    route.params || {};

  const accounts = useSelector(accountsSelector);
  const enhancedAccounts = useMemo(() => {
    if (selectedCurrency) {
      const filteredAccounts = accounts.filter(
        acc =>
          acc.currency.id ===
          (selectedCurrency.type === "TokenCurrency"
            ? selectedCurrency.parentCurrency.id
            : selectedCurrency.id),
      );
      if (selectedCurrency.type === "TokenCurrency") {
        // add in the token subAccount if it does not exist
        return flattenAccounts(
          filteredAccounts.map(acc =>
            accountWithMandatoryTokens(acc, [selectedCurrency]),
          ),
        ).filter(
          acc =>
            acc.type === "Account" ||
            (acc.type === "TokenAccount" &&
              acc.token.id === selectedCurrency.id),
        );
      }
      return flattenAccounts(filteredAccounts);
    }
    return flattenAccounts(accounts);
  }, [accounts, selectedCurrency]);
  const allAccounts = enhancedAccounts;

  const handleSelectAccount = useCallback(
    account => {
      navigation.navigate(ScreenName.ReceiveConnectDevice, {
        account,
        accountId: account.id,
        parentId: account.type !== "Account" ? account.parentId : undefined,
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView
      flex={1}
      backgroundColor={colors.background}
      forceInset={forceInset}
    >
      <TrackScreen category="ReceiveFunds" name="SelectAccount" />
      <KeyboardView flex={1}>
        <Flex p={6}>
          <AccountSelector
            list={allAccounts}
            onSelectAccount={handleSelectAccount}
            initialCurrencySelected={initialCurrencySelected}
          />
        </Flex>
      </KeyboardView>
    </SafeAreaView>
  );
}
