/* @flow */
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Linking,
} from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import type {
  Account,
  AccountLike,
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";

import { isAccountEmpty } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { getAccountCapabilities } from "@ledgerhq/live-common/lib/compound/logic";
import {
  getAccountName,
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account/helpers";
import { useTheme } from "@react-navigation/native";
import { subAccountByCurrencyOrderedScreenSelector } from "../../../reducers/accounts";
import { rgba } from "../../../colors";
import { ScreenName, NavigatorName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import LText from "../../../components/LText";
import FilteredSearchBar from "../../../components/FilteredSearchBar";
import KeyboardView from "../../../components/KeyboardView";
import InfoBox from "../../../components/InfoBox";
import LendingWarnings from "../shared/LendingWarnings";
import Card from "../../../components/Card";
import CurrencyIcon from "../../../components/CurrencyIcon";
import CheckCircle from "../../../icons/CheckCircle";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import ConfirmationModal from "../../../components/ConfirmationModal";
import Circle from "../../../components/Circle";
import Info from "../../../icons/Info";
import { urls } from "../../../config/urls";
import { discreetModeSelector } from "../../../reducers/settings";

const SEARCH_KEYS = [
  "account.name",
  "account.unit.code",
  "account.token.name",
  "account.token.ticker",
];

type Props = {
  navigation: any,
  route: { params?: { currency: CryptoCurrency | TokenCurrency } },
};

const keyExtractor = item => item.account.id;

function LendingEnableSelectAccount({ route, navigation }: Props) {
  const { colors } = useTheme();
  const currency = route?.params?.currency;
  invariant(currency, "currency required");
  const discreet = useSelector(discreetModeSelector);

  let enabledTotalAmount = null;
  const accounts = useSelector(
    subAccountByCurrencyOrderedScreenSelector(route),
  );
  const filteredAccounts = accounts.filter(
    ({ account }) =>
      account.type === "TokenAccount" && !isAccountEmpty(account),
  );

  useEffect(() => {
    if (!filteredAccounts.length) {
      const n = navigation.dangerouslyGetParent() || navigation;
      n.replace(NavigatorName.AddAccounts, {
        screen: ScreenName.AddAccountsTokenCurrencyDisclaimer,
        params: { token: currency },
      });
    }
  }, [currency, filteredAccounts, navigation]);

  let accountsWithUnlimitedEnabledAmount = 0;
  filteredAccounts.forEach(({ account }) => {
    const { enabledAmount, enabledAmountIsUnlimited } =
      (account.type === "TokenAccount" && getAccountCapabilities(account)) ||
      {};
    if (enabledAmountIsUnlimited) {
      enabledTotalAmount = Infinity;
      accountsWithUnlimitedEnabledAmount += 1;
      return;
    }
    // no need to calculate enabledTotalAmount
    if (
      enabledAmount &&
      enabledAmount.gt(0) &&
      !accountsWithUnlimitedEnabledAmount
    ) {
      enabledTotalAmount = BigNumber(enabledTotalAmount || 0).plus(
        enabledAmount,
      );
    }
  });

  const formattedEnabledAmount =
    enabledTotalAmount instanceof BigNumber &&
    formatCurrencyUnit(currency.units[0], enabledTotalAmount, {
      showCode: true,
      disableRounding: false,
      discreet,
    });

  const [approveInfoModalOpen, setApproveInfoModalOpen] = useState(false);

  const closeApproveInfoModal = useCallback(
    () => setApproveInfoModalOpen(false),
    [],
  );
  const redirectToEnableFlow = useCallback(() => {
    const n = navigation.dangerouslyGetParent() || navigation;
    n.push(ScreenName.LendingEnableAmount, { ...approveInfoModalOpen });
    closeApproveInfoModal();
  }, [approveInfoModalOpen, closeApproveInfoModal, navigation]);

  const redirectToSupplyFlow = useCallback(
    params => {
      const n = navigation.dangerouslyGetParent() || navigation;
      n.replace(NavigatorName.LendingSupplyFlow, {
        screen: ScreenName.LendingSupplyAmount,
        params,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({
      item: result,
    }: {
      item: { account: AccountLike, parentAccount?: Account },
    }) => {
      const { account, parentAccount } = result;

      const currency = getAccountCurrency(account);
      const unit = getAccountUnit(account);
      const capabilities =
        account.type === "TokenAccount" && getAccountCapabilities(account);
      const name = getAccountName(parentAccount || account);
      const isEnabled =
        capabilities &&
        ((capabilities.enabledAmount && capabilities.enabledAmount.gt(0)) ||
          capabilities.enabledAmountIsUnlimited);

      return (
        <View
          style={
            account.type === "Account"
              ? undefined
              : [styles.tokenCardStyle, { borderLeftColor: colors.fog }]
          }
        >
          <Card
            onPress={() => {
              isEnabled
                ? redirectToSupplyFlow({
                    accountId: account.id,
                    parentId:
                      account.type !== "Account"
                        ? account.parentId
                        : parentAccount?.id,
                    currency,
                  })
                : setApproveInfoModalOpen({
                    accountId: account.id,
                    parentId:
                      account.type !== "Account"
                        ? account.parentId
                        : parentAccount?.id,
                    currency,
                  });
            }}
            style={[styles.card, styles.cardStyle]}
          >
            <CurrencyIcon size={20} currency={currency} />
            <View style={styles.accountName}>
              <LText
                semiBold
                numberOfLines={1}
                style={[styles.accountNameText, { color: colors.darkBlue }]}
              >
                {name}
              </LText>
            </View>
            <View style={styles.balanceContainer}>
              <LText semiBold style={styles.balanceNumText} color="grey">
                <CurrencyUnitValue
                  showCode
                  unit={unit}
                  value={account.balance}
                />
              </LText>
              {isEnabled && <CheckCircle size={16} color={colors.success} />}
            </View>
          </Card>
        </View>
      );
    },
    [colors.darkBlue, colors.fog, colors.success, redirectToSupplyFlow],
  );
  const renderList = useCallback(
    items => (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
      />
    ),
    [renderItem],
  );

  const renderEmptySearch = useCallback(
    () => (
      <View style={styles.emptyResults}>
        <LText style={styles.emptyText} color="fog">
          <Trans i18nKey="transfer.receive.noAccount" />
        </LText>
      </View>
    ),
    [],
  );
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="Lend Approve"
        name="Select Account"
        eventProperties={{ currencyName: currency.name }}
      />
      <LendingWarnings />
      <ConfirmationModal
        isOpened={!!approveInfoModalOpen}
        onClose={closeApproveInfoModal}
        onConfirm={redirectToEnableFlow}
        confirmationTitle={
          <Trans i18nKey="transfer.lending.enable.info.title" />
        }
        confirmationDesc={
          <Trans i18nKey="transfer.lending.enable.info.description" />
        }
        confirmButtonText={<Trans i18nKey="transfer.lending.enable.info.cta" />}
        Icon={() => (
          <Circle size={56} bg={rgba(colors.live, 0.2)}>
            <Info size={24} color={colors.live} />
          </Circle>
        )}
        hideRejectButton
      />
      <KeyboardView style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <FilteredSearchBar
            list={filteredAccounts}
            inputWrapperStyle={styles.padding}
            renderList={renderList}
            renderEmptySearch={renderEmptySearch}
            keys={SEARCH_KEYS}
          />
        </View>
        <View style={styles.infoSection}>
          <InfoBox
            onLearnMore={
              !enabledTotalAmount
                ? () => {
                    Linking.openURL(urls.compound);
                  }
                : undefined
            }
          >
            {enabledTotalAmount ? (
              <Trans
                i18nKey={
                  enabledTotalAmount < Infinity
                    ? "transfer.lending.enable.selectAccount.enabledAccountsAmount"
                    : "transfer.lending.enable.selectAccount.enabledAccountsNoLimit"
                }
                values={{
                  number:
                    enabledTotalAmount < Infinity
                      ? filteredAccounts.length
                      : accountsWithUnlimitedEnabledAmount,
                  amount: formattedEnabledAmount,
                  currency: currency.name,
                }}
                count={
                  enabledTotalAmount < Infinity
                    ? filteredAccounts.length
                    : accountsWithUnlimitedEnabledAmount
                }
              />
            ) : (
              <Trans i18nKey="transfer.lending.enable.selectAccount.noEnabledAccounts" />
            )}
          </InfoBox>
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tokenCardStyle: {
    marginLeft: 26,
    paddingLeft: 7,
    borderLeftWidth: 1,
  },
  searchContainer: {
    paddingTop: 16,
    flex: 1,
  },
  list: {
    paddingBottom: 32,
  },
  emptyResults: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  padding: {
    paddingHorizontal: 16,
  },
  cardStyle: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  infoSection: { padding: 16 },
  card: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
  },
  accountName: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: 8,
  },
  accountNameText: {
    fontSize: 14,
  },
  balanceContainer: {
    flexDirection: "row",
    marginLeft: 16,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  balanceNumText: {
    marginRight: 6,
  },
});

export default LendingEnableSelectAccount;
