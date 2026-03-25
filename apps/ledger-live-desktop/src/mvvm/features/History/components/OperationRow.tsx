import React, { useCallback, memo } from "react";
import { TableRow, TableCell, TableCellContent } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import { isIncomingType } from "../utils/isIncomingType";
import { truncateAddress } from "../utils/truncateAddress";
import type { OperationRow as OperationRowType } from "../types";

type OperationRowProps = {
  readonly row: OperationRowType;
  readonly onRowClick: (row: OperationRowType) => void;
};

function OperationRow({ row, onRowClick }: OperationRowProps) {
  const { t } = useTranslation();
  const handleClick = useCallback(() => onRowClick(row), [onRowClick, row]);
  const { operation, currency, amount, address, type } = row.original;

  const typeLabel = operation.hasFailed
    ? t("operationDetails.failed")
    : t(`operation.type.${operation.type}`);

  const addressPrefix = isIncomingType(type) ? t("history.address.from") : t("history.address.to");

  const unit = currency.units[0];

  return (
    <TableRow clickable onClick={handleClick}>
      <TableCell>
        <TableCellContent
          leadingContent={<CryptoCurrencyIcon currency={currency} size={32} />}
          title={typeLabel}
        />
      </TableCell>
      <TableCell align="end">
        <TableCellContent
          align="end"
          title={
            <div className="inline-flex items-center gap-4">
              {`${addressPrefix} ${truncateAddress(address)}`}
              {currency.type !== "FiatCurrency" && (
                <SquaredCryptoIcon
                  ledgerId={currency.id}
                  ticker={currency.ticker}
                  size="20px"
                  {...(currency.type === "TokenCurrency"
                    ? { network: currency.parentCurrency.id }
                    : {})}
                />
              )}
            </div>
          }
        />
      </TableCell>
      <TableCell align="end">
        <FormattedVal
          val={amount}
          unit={unit}
          showCode
          fontSize={4}
          alwaysShowSign
          color={amount.isNegative() ? "neutral.c80" : undefined}
        />
      </TableCell>
      <TableCell align="end">
        <CounterValue
          color="neutral.c80"
          fontSize={3}
          alwaysShowSign
          date={operation.date}
          currency={currency}
          value={amount}
        />
      </TableCell>
    </TableRow>
  );
}

const MemoizedOperationRow = memo(OperationRow);
export { MemoizedOperationRow as OperationRow };
