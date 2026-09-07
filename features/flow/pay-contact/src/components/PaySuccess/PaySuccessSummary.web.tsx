import React from "react";
import {
  DescriptionItem,
  DescriptionItemLeading,
  DescriptionItemLabel,
  DescriptionItemTrailing,
  DescriptionItemValue,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

const ICON_SIZE = 16;

export type PaySuccessSummaryIcon = Readonly<{
  ledgerId: string;
  ticker: string;
}>;

export type PaySuccessSummaryRow = Readonly<{
  id: string;
  label: string;
  value: string;
  trailingIcon?: PaySuccessSummaryIcon;
}>;

export type PaySuccessSummaryProps = Readonly<{
  rows: ReadonlyArray<PaySuccessSummaryRow>;
}>;

export function PaySuccessSummary({ rows }: PaySuccessSummaryProps) {
  return (
    <div className="flex flex-col gap-12">
      {rows.map(({ id, label, value, trailingIcon }) => (
        <DescriptionItem key={id}>
          <DescriptionItemLeading>
            <DescriptionItemLabel>{label}</DescriptionItemLabel>
          </DescriptionItemLeading>
          <DescriptionItemTrailing>
            <span className="flex items-center gap-8">
              <DescriptionItemValue>{value}</DescriptionItemValue>
              {trailingIcon ? (
                <span data-testid="pay-success-summary-icon">
                  <CryptoIcon
                    ledgerId={trailingIcon.ledgerId}
                    ticker={trailingIcon.ticker}
                    size={ICON_SIZE}
                    shape="square"
                  />
                </span>
              ) : null}
            </span>
          </DescriptionItemTrailing>
        </DescriptionItem>
      ))}
    </div>
  );
}
