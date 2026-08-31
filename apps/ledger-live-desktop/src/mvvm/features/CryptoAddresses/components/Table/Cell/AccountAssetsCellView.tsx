import React from "react";
import { TableCellItem, TableCellContent, TableCellContentTitle } from "@ledgerhq/lumen-ui-react";
import type { CryptoIconSize } from "LLD/components/SquaredCryptoIcon";
import { CryptoIconStack, type CryptoIconStackItem } from "LLD/components/CryptoIconStack";

type AccountAssetsCellViewProps = {
  readonly iconSize: CryptoIconSize;
  readonly items: readonly CryptoIconStackItem[];
};

export function AccountAssetsCellView({ iconSize, items }: AccountAssetsCellViewProps) {
  return (
    <TableCellItem align="end">
      <TableCellContent>
        <TableCellContentTitle>
          <CryptoIconStack
            size={iconSize}
            items={items}
            testID="account-assets-cell"
            overflowTestID="account-assets-overflow"
          />
        </TableCellContentTitle>
      </TableCellContent>
    </TableCellItem>
  );
}
