import React, { useCallback, useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Currency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getTagDerivationMode } from "@ledgerhq/live-common/derivation";
import { useSelector } from "react-redux";
import { useCalculate } from "@ledgerhq/live-common/countervalues/react";
import { BigNumber } from "bignumber.js";
import { ScreenName } from "../../const";
import { useBalanceHistoryWithCountervalue } from "../../actions/portfolio";
import { counterValueCurrencySelector } from "../../reducers/settings";
import AccountRowLayout from "../../components/AccountRowLayout";

type Props = {
  account: Account | TokenAccount;
  accountId: string;
  navigation: any;
  isLast: boolean;
  onSetAccount: (_: TokenAccount) => void;
  portfolioValue: number;
  navigationParams?: any[];
  hideDelta?: boolean;
  topLink?: boolean;
  bottomLink?: boolean;
};

const AccountRow = ({
  navigation,
  account,
  accountId,
  portfolioValue,
  navigationParams,
  hideDelta,
  topLink,
  bottomLink,
}: Props) => {
  // makes it refresh if this changes
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const currency = getAccountCurrency(account);
  const name = getAccountName(account);
  const unit = getAccountUnit(account);

  const tag =
    account.derivationMode !== undefined &&
    account.derivationMode !== null &&
    getTagDerivationMode(currency as CryptoCurrency, account.derivationMode);

  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );

  const countervalue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value:
      account.balance instanceof BigNumber
        ? account.balance.toNumber()
        : account.balance,
    disableRounding: true,
  });

  const portfolioPercentage = useMemo(
    () => (countervalue ? countervalue / Math.max(1, portfolioValue) : 0), // never divide by potential zero, we dont want to go towards infinity
    [countervalue, portfolioValue],
  );

  const { countervalueChange } = useBalanceHistoryWithCountervalue({
    account,
    range: "day",
  });

  const onAccountPress = useCallback(() => {
    if (navigationParams) {
      navigation.navigate(...navigationParams);
    } else if (account.type === "Account") {
      navigation.navigate(ScreenName.Account, {
        accountId,
        isForwardedFromAccounts: true,
      });
    } else if (account.type === "TokenAccount") {
      navigation.navigate(ScreenName.Account, {
        parentId: account?.parentId,
        accountId: account.id,
      });
    }
  }, [account, accountId, navigation, navigationParams]);

  return (
    <AccountRowLayout
      onPress={onAccountPress}
      currency={currency}
      currencyUnit={unit}
      balance={account.balance}
      name={name}
      countervalueChange={countervalueChange}
      tag={tag}
      progress={portfolioPercentage}
      topLink={topLink}
      bottomLink={bottomLink}
      hideDelta={hideDelta}
    />
  );
};

export default React.memo<Props>(AccountRow);
