import React, { useCallback } from "react";
import { Account } from "@ledgerhq/types-live";
import {
  ListItem,
  ListItemContent,
  ListItemTrailing,
  ListItemTitle,
  ListItemDescription,
} from "@ledgerhq/lumen-ui-rnative";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import { useSelector } from "~/context/hooks";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/reducers/settings";
import AccountItem from "LLM/features/Accounts/components/AccountItem";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  account: Account;
  aggregatedCountervalue: BigNumber;
  subAccountsCount: number;
  onPress: (account: Account) => void;
}>;

export default function CryptoAddressesListItem({
  account,
  aggregatedCountervalue,
  subAccountsCount,
  onPress,
}: Props) {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const handlePress = useCallback(() => onPress(account), [account, onPress]);

  const formattedBalance = formatCurrencyUnit(
    counterValueCurrency.units[0],
    aggregatedCountervalue,
    { showCode: true, locale, discreet },
  );

  const displayedAssetsCount = subAccountsCount + 1;

  return (
    <ListItem onPress={handlePress}>
      <AccountItem
        account={account}
        balance={account.balance}
        hideBalanceInfo
        withPlaceholder
        squaredIcon
      />
      <ListItemTrailing>
        <ListItemContent>
          <ListItemTitle>{formattedBalance}</ListItemTitle>
          <ListItemDescription testID="assets-count">
            {t("cryptoAddresses.assetsCount", { count: displayedAssetsCount })}
          </ListItemDescription>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}
