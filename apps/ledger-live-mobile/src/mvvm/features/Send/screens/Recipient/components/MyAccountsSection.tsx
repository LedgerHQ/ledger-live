import React, { useCallback, useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { accountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import { AccountListItem } from "./AccountListItem";

type MyAccountsSectionProps = Readonly<{
  currency: CryptoOrTokenCurrency;
  currentAccountId: string;
  onSelect: (account: Account) => void;
}>;

export function MyAccountsSection({
  currency,
  currentAccountId,
  onSelect,
}: MyAccountsSectionProps) {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      container: {
        gap: theme.spacings.s12,
      },
      header: {
        paddingHorizontal: theme.spacings.s8,
      },
      list: {
        gap: 0,
      },
    }),
    [],
  );
  const allAccountTuples = useSelector(accountsByCryptoCurrencyScreenSelector(currency));

  const userAccountsForCurrency = useMemo(() => {
    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);
    const allowSelfTransfer = selfTransferPolicy === "free" || selfTransferPolicy === "warning";

    return allAccountTuples.filter((tuple): tuple is typeof tuple & { account: Account } => {
      const { account } = tuple;
      if (account.type !== "Account") return false;
      if (account.id === currentAccountId && !allowSelfTransfer) return false;
      const accCurrency = getAccountCurrency(account);
      return accCurrency.id === currency.id;
    });
  }, [allAccountTuples, currency, currentAccountId]);

  const handleSelect = useCallback(
    (account: Account) => {
      onSelect(account);
    },
    [onSelect],
  );

  if (userAccountsForCurrency.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Subheader style={styles.header}>
        <SubheaderRow>
          <SubheaderTitle>{t("newSendFlow.myAccounts")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <View style={styles.list}>
        {userAccountsForCurrency.map(({ account, name }) => (
          <AccountListItem
            key={account.id}
            account={account}
            accountName={name}
            currency={currency}
            onSelect={() => handleSelect(account)}
          />
        ))}
      </View>
    </View>
  );
}
