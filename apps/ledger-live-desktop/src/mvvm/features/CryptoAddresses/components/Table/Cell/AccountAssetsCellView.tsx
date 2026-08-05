import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { TableCellItem, TableCellContent, TableCellContentTitle } from "@ledgerhq/lumen-ui-react";
import type { CryptoIconSize } from "LLD/components/SquaredCryptoIcon";
import { IconStack } from "LLD/components/IconStack";
import type { AccountAssetCurrency } from "LLD/features/CryptoAddresses/utils/getAccountAssetsCurrencies";

type AccountAssetsCellViewProps = {
  readonly iconSize: CryptoIconSize;
  readonly items: readonly AccountAssetCurrency[];
  readonly tooltipContent: string;
};

export function AccountAssetsCellView({
  iconSize,
  items,
  tooltipContent,
}: AccountAssetsCellViewProps) {
  return (
    <TableCellItem align="end">
      <TableCellContent>
        <TableCellContentTitle>
          <IconStack
            size={iconSize}
            borderRadius="50%"
            testID="account-assets-cell"
            items={items}
            getItemKey={currency => currency.id}
            renderItem={currency => (
              <CryptoIcon ledgerId={currency.id} ticker={currency.ticker} size={iconSize} />
            )}
            getTooltipContent={() => tooltipContent}
            overflowTestID="account-assets-overflow"
          />
        </TableCellContentTitle>
      </TableCellContent>
    </TableCellItem>
  );
}
