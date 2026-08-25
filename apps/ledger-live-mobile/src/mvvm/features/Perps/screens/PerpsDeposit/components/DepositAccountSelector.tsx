import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronDown } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { TFunction } from "i18next";
import { useTranslation } from "~/context/Locale";

type DepositAccountSelectorProps = Readonly<{
  ticker: string;
  ledgerId: string;
  accountName: string | null;
  counterValue: string | null;
  exceedsBalance: boolean;
  missingAccount: boolean;
  onSelect: () => void;
}>;

/** An account with no price to show falls back to its name alone. */
function describeAccount(
  t: TFunction,
  accountName: string | null,
  counterValue: string | null,
): string {
  if (accountName === null) return t("perpsDeposit.selectCurrencyNoAccount");
  if (counterValue === null) return accountName;
  return t("perpsDeposit.selectCurrencyAccount", { accountName, counterValue });
}

export function DepositAccountSelector({
  ticker,
  ledgerId,
  accountName,
  counterValue,
  exceedsBalance,
  missingAccount,
  onSelect,
}: DepositAccountSelectorProps) {
  const { t } = useTranslation();
  const hasAccount = accountName !== null;
  const hasError = hasAccount ? exceedsBalance : missingAccount;

  const description = describeAccount(t, accountName, counterValue);

  return (
    <ListItem
      onPress={onSelect}
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
      testID="perps-deposit-select-currency"
    >
      <ListItemLeading>
        <CryptoIcon size={32} ledgerId={ledgerId} ticker={ticker} />
        <ListItemContent>
          <ListItemTitle>
            {t("perpsDeposit.selectCurrencyTitle", { currencyTicker: ticker })}
          </ListItemTitle>
          <ListItemDescription lx={{ color: hasError ? "error" : "muted" }}>
            {description}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronDown size={24} />
      </ListItemTrailing>
    </ListItem>
  );
}
