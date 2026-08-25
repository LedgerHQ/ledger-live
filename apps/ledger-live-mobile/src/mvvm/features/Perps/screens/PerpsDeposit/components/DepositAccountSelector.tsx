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

  const description =
    accountName === null
      ? t("perpsDeposit.selectCurrencyNoAccount")
      : counterValue === null
        ? accountName
        : t("perpsDeposit.selectCurrencyAccount", { accountName, counterValue });

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
