import React, { useCallback } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { TokenAccount, AccountLike } from "@ledgerhq/types-live";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { GestureResponderEvent } from "react-native";

import { NavigatorName, ScreenName } from "~/const";
import { useBalanceHistoryWithCountervalue } from "~/hooks/portfolio";
import AccountRowLayout from "~/components/AccountRowLayout";
import { useParentAccount } from "~/hooks/useParentAccount";
import { track } from "~/analytics";
import { useNavigation } from "@react-navigation/native";
import { useAccountName, useMaybeAccountName } from "~/reducers/wallet";
import { useAccountUnit } from "~/hooks/useAccountUnit";

type Props = {
  account: AccountLike;
  accountId: string;
  isLast?: boolean;
  onSetAccount?: (arg: TokenAccount) => void;
  navigationParams?: [ScreenName, object];
  hideDelta?: boolean;
  topLink?: boolean;
  bottomLink?: boolean;
  sourceScreenName: ScreenName;
};

const AccountRow = ({
  account,
  accountId,
  navigationParams,
  hideDelta,
  topLink,
  bottomLink,
  isLast,
}: Props) => {
  const navigation = useNavigation();
  // makes it refresh if this changes
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const currency = getAccountCurrency(account);
  const parentAccount = useParentAccount(account);

  const name = useAccountName(account);
  const parentName = useMaybeAccountName(parentAccount);
  const unit = useAccountUnit(account);

  const tag =
    account.type === "Account" &&
    account?.derivationMode !== undefined &&
    account?.derivationMode !== null &&
    currency.type === "CryptoCurrency" &&
    getTagDerivationMode(currency, account.derivationMode);
  const parentId = account.type === "TokenAccount" ? account.parentId : undefined;

  const { countervalueChange } = useBalanceHistoryWithCountervalue({
    account,
    range: "day",
  });

  const onAccountPress = useCallback(
    (_uiEvent: GestureResponderEvent) => {
      track("account_clicked", {
        currency: currency.name,
      });
      if (navigationParams) {
        // @ts-expect-error navigagtion spread
        navigation.navigate(...navigationParams);
      } else if (account.type === "Account") {
        navigation.navigate(ScreenName.Account, {
          accountId,
        });
      } else if (account.type === "TokenAccount") {
        navigation.navigate(NavigatorName.Accounts, {
          screen: ScreenName.Account,
          params: {
            currencyId: currency.id,
            parentId,
            accountId: account.id,
          },
        });
      }
    },
    [
      account.id,
      account.type,
      accountId,
      currency.id,
      currency.name,
      navigation,
      navigationParams,
      parentId,
    ],
  );

  return (
    <AccountRowLayout
      onPress={onAccountPress}
      currency={currency}
      currencyUnit={unit}
      balance={account.balance}
      name={name}
      id={accountId}
      countervalueChange={countervalueChange}
      tag={tag}
      topLink={topLink}
      bottomLink={bottomLink}
      hideDelta={hideDelta}
      parentAccountName={parentName}
      isLast={isLast}
    />
  );
};

export default React.memo<Props>(AccountRow);
