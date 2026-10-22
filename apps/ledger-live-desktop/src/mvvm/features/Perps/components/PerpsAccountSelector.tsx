import React from "react";
import { Trans } from "react-i18next";
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

type PerpsAccountSelectorProps = Readonly<{
  title: string;
  ticker: string;
  ledgerId: string;
  accountName: string | null;
  counterValue: string | null;
  accountLabelKey: string;
  noAccountLabel: string;
  exceedsBalance: boolean;
  missingAccount: boolean;
  onSelect: () => void;
  testId: string;
}>;

function AccountDescription({
  accountName,
  counterValue,
  accountLabelKey,
  noAccountLabel,
  exceedsBalance,
  missingAccount,
}: Pick<
  PerpsAccountSelectorProps,
  | "accountName"
  | "counterValue"
  | "accountLabelKey"
  | "noAccountLabel"
  | "exceedsBalance"
  | "missingAccount"
>) {
  if (accountName === null) {
    return <span className={cn(missingAccount && "text-error")}>{noAccountLabel}</span>;
  }

  if (counterValue === null) return <span>{accountName}</span>;

  return (
    <Trans
      i18nKey={accountLabelKey}
      values={{ accountName, counterValue }}
      components={{
        balance: <span className={cn(exceedsBalance && "text-error")} />,
      }}
    />
  );
}

export function PerpsAccountSelector({
  title,
  ticker,
  ledgerId,
  onSelect,
  testId,
  ...descriptionProps
}: PerpsAccountSelectorProps) {
  return (
    <ListItem className="bg-surface mt-24" onClick={onSelect} data-testid={testId}>
      <ListItemLeading>
        <CryptoIcon size={32} ledgerId={ledgerId} ticker={ticker} />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription>
            <AccountDescription {...descriptionProps} />
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronDown size={24} className="text-muted" />
      </ListItemTrailing>
    </ListItem>
  );
}
