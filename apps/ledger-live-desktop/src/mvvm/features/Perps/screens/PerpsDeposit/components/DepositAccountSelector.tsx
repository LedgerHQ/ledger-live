import React from "react";
import { useTranslation, Trans } from "react-i18next";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronDown } from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { cn } from "LLD/utils/cn";

type DepositAccountSelectorProps = Readonly<{
  ticker: string;
  ledgerId: string;
  accountName: string | null;
  counterValue: string | null;
  exceedsBalance: boolean;
  missingAccount: boolean;
  onSelect: () => void;
}>;

function DepositAccountDescription({
  accountName,
  counterValue,
  exceedsBalance,
  missingAccount,
}: Pick<
  DepositAccountSelectorProps,
  "accountName" | "counterValue" | "exceedsBalance" | "missingAccount"
>) {
  const { t } = useTranslation();

  if (accountName === null) {
    return (
      <span className={cn(missingAccount && "text-error")}>
        {t("perpsDeposit.selectCurrencyNoAccount")}
      </span>
    );
  }

  if (counterValue === null) return <span>{accountName}</span>;

  return (
    <Trans
      i18nKey="perpsDeposit.selectCurrencyAccount"
      values={{ accountName, counterValue }}
      components={{
        balance: <span className={cn(exceedsBalance && "text-error")} />,
      }}
    />
  );
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

  return (
    <ListItem
      className="bg-surface mt-24"
      onClick={onSelect}
      data-testid="perps-deposit-select-currency"
    >
      <ListItemLeading>
        <CryptoIcon size={32} ledgerId={ledgerId} ticker={ticker} />
        <ListItemContent>
          <ListItemTitle>
            {t("perpsDeposit.selectCurrencyTitle", { currencyTicker: ticker })}
          </ListItemTitle>
          <ListItemDescription>
            <DepositAccountDescription
              accountName={accountName}
              counterValue={counterValue}
              exceedsBalance={exceedsBalance}
              missingAccount={missingAccount}
            />
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronDown size={24} className="text-muted" />
      </ListItemTrailing>
    </ListItem>
  );
}
