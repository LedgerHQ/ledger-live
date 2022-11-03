import React, { useMemo, useCallback, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import find from "lodash/find";
import type { CurrentRate } from "@ledgerhq/live-common/families/ethereum/modules/compound";
import { useNavigation, useTheme } from "@react-navigation/native";
import { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import LText from "../../../components/LText";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CurrencyIcon from "../../../components/CurrencyIcon";
import Touchable, {
  Props as TouchableProps,
} from "../../../components/Touchable";
import { NavigatorName, ScreenName } from "../../../const";
import InfoModalBottom from "./InfoModalBottom";
import { getSupportedCurrencies } from "../../Exchange/coinifyConfig";

const Row = ({
  data,
  accounts,
  onPress,
}: {
  data: CurrentRate;
  accounts: AccountLike[];
  onPress: (token: TokenCurrency) => TouchableProps["onPress"];
}) => {
  const { colors } = useTheme();
  const { token, supplyAPY } = data;
  const totalBalance = useMemo(
    () =>
      accounts.reduce((total, account) => {
        if (account.type !== "TokenAccount") return total;
        if (account.token.id !== token.id) return total;
        return total.plus(account.spendableBalance);
      }, BigNumber(0)),
    [token.id, accounts],
  );
  return (
    <Touchable
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
        },
      ]}
      onPress={onPress(token)}
      event="Page Lend deposit"
      eventProperties={{
        currency: token.id,
      }}
    >
      <CurrencyIcon radius={100} currency={token} size={32} />
      <View style={styles.currencySection}>
        <LText semiBold style={styles.title}>
          {token.ticker}
        </LText>
        <LText style={styles.subTitle} color="grey">
          <CurrencyUnitValue
            unit={token.units[0]}
            value={totalBalance}
            showCode
          />
        </LText>
      </View>
      <LText
        bold
        style={[
          styles.badge,
          {
            backgroundColor: colors.lightLive,
          },
        ]}
        color="live"
      >
        <Trans
          i18nKey="transfer.lending.dashboard.apy"
          values={{
            value: supplyAPY,
          }}
        />
      </LText>
    </Touchable>
  );
};

const Rates = ({
  rates,
  accounts,
}: {
  rates: CurrentRate[];
  accounts: AccountLike[];
}) => {
  const navigation = useNavigation();
  const [modalOpen, setModalOpen] = useState<TokenCurrency>();
  const navigateToEnableFlow = useCallback(
    token => {
      navigation.navigate(NavigatorName.LendingEnableFlow, {
        screen: ScreenName.LendingEnableSelectAccount,
        params: {
          token,
        },
      });
    },
    [navigation],
  );
  const navigateToBuyFlow = useCallback(
    token => {
      navigation.navigate(NavigatorName.ExchangeStack, {
        screen: ScreenName.ExchangeSelectAccount,
        params: {
          currency: token,
          mode: "buy",
        },
      });
    },
    [navigation],
  );
  const CheckIfCanNavigate = useCallback(
    (token: TokenCurrency) => () => {
      if (
        find(
          accounts,
          (account: TokenAccount) => account?.token.id === token.id,
        )
      ) {
        return navigateToEnableFlow(token);
      }

      return setModalOpen(token);
    },
    [accounts, navigateToEnableFlow],
  );
  const selectedTokenCanBuy =
    modalOpen && getSupportedCurrencies("buy").includes(modalOpen.id);
  const buttons = [];

  if (selectedTokenCanBuy) {
    buttons.push({
      title: (
        <Trans
          i18nKey="transfer.lending.noTokenAccount.buttons.buy"
          values={{
            name: modalOpen?.name,
          }}
        />
      ),
      onPress: () => {
        setModalOpen(undefined);
        navigateToBuyFlow(modalOpen);
      },
    });
  }

  buttons.push({
    title: (
      <Trans
        i18nKey="transfer.lending.noTokenAccount.buttons.receive"
        values={{
          name: modalOpen?.name,
        }}
      />
    ),
    onPress: () => {
      setModalOpen(undefined);
      navigateToEnableFlow(modalOpen);
    },
  });
  return (
    <View>
      <FlatList
        data={rates}
        renderItem={({ item }) => (
          <Row data={item} accounts={accounts} onPress={CheckIfCanNavigate} />
        )}
        keyExtractor={item => item.ctoken.id}
      />
      <InfoModalBottom
        isOpened={!!modalOpen}
        onClose={() => setModalOpen(undefined)}
        title={
          <Trans
            i18nKey="transfer.lending.noTokenAccount.info.title"
            values={{
              name: modalOpen?.name,
            }}
          />
        }
        description={
          <Trans
            i18nKey="transfer.lending.noTokenAccount.info.description"
            values={{
              name: modalOpen?.name,
            }}
          />
        }
        Icon={
          modalOpen &&
          (() => <CurrencyIcon radius={100} currency={modalOpen} size={54} />)
        }
        buttons={buttons}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 8,
    marginVertical: 4,
    height: 70,
    borderRadius: 4,
  },
  currencySection: {
    paddingHorizontal: 8,
    flex: 1,
  },
  title: {
    lineHeight: 17,
    fontSize: 14,
  },
  subTitle: {
    lineHeight: 15,
    fontSize: 12,
  },
  badge: {
    fontSize: 13,
    lineHeight: 24,
    borderRadius: 24,
    height: 24,
    paddingHorizontal: 8,
  },
});
export default Rates;
