import React, { useCallback, useEffect } from "react";
import { FlatList } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";

import { Flex } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { useTranslation } from "react-i18next";
import { AccountLike, Currency } from "@ledgerhq/live-common/lib/types";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import AccountCard from "../../components/AccountCard";
import LText from "../../components/LText";

const forceInset = { bottom: "always" };

const StyledSaferAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
`;

type Props = {
  navigation: any;
  route: { params?: { currency?: Currency } };
};

function ReceiveSelectAccount({ navigation, route }: Props) {
  const currency = route.params?.currency;
  const { t } = useTranslation();

  const accounts = useSelector(
    flattenAccountsByCryptoCurrencyScreenSelector(currency),
  );

  const selectAccount = useCallback(
    (account: AccountLike) => {
      navigation.navigate(ScreenName.ReceiveConfirmation, {
        ...route.params,
        accountId: account.id,
      });
    },
    [navigation, route.params],
  );

  useEffect(() => {
    if (accounts.length === 1) {
      selectAccount(accounts[0]);
    } else if (accounts.length <= 0) {
      navigation.navigate(ScreenName.ReceiveAddAccountSelectDevice, {
        ...route.params,
        currency,
      });
    }
  }, [accounts, currency, navigation, route.params, selectAccount]);

  const renderItem = useCallback(
    ({ item: account }: { item: SearchResult }) => (
      <Flex px={6}>
        <AccountCard account={account} onPress={() => selectAccount(account)} />
      </Flex>
    ),
    [selectAccount],
  );

  const keyExtractor = useCallback(item => item?.id, []);

  return accounts.length > 1 ? (
    <StyledSaferAreaView forceInset={forceInset}>
      <TrackScreen category="ReceiveFunds" name="SelectAccount" />
      <LText variant="h2" px={6} mb={2}>
        {t("transfer.receive.selectAccount.title")}
      </LText>
      <LText variant="body" color="neutral.c80" px={6} mb={6}>
        {t("transfer.receive.selectAccount.subtitle", {
          currencyTicker: currency?.ticker,
        })}
      </LText>
      <FlatList
        data={accounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    </StyledSaferAreaView>
  ) : null;
}

export default ReceiveSelectAccount;
