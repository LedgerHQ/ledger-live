import React from "react";
import {
  Box,
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
} from "@ledgerhq/lumen-ui-rnative";
import CryptoIcon from "@ledgerhq/crypto-icons/native";

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
    <Box lx={{ gap: "s12", width: "full" }}>
      {rows.map(({ id, label, value, trailingIcon }) => (
        <DescriptionItem key={id} size="md">
          <DescriptionItemLeading>
            <DescriptionItemLabel>{label}</DescriptionItemLabel>
          </DescriptionItemLeading>
          <DescriptionItemTrailing>
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
              <DescriptionItemValue>{value}</DescriptionItemValue>
              {trailingIcon ? (
                <Box testID="pay-success-summary-icon">
                  <CryptoIcon
                    ledgerId={trailingIcon.ledgerId}
                    ticker={trailingIcon.ticker}
                    size={ICON_SIZE}
                    shape="square"
                  />
                </Box>
              ) : null}
            </Box>
          </DescriptionItemTrailing>
        </DescriptionItem>
      ))}
    </Box>
  );
}
