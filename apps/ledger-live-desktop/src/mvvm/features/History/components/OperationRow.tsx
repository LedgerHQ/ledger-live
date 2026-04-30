import React, { useCallback, memo } from "react";
import { TableRow, TableCell, TableCellContent } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import { BalanceCell } from "LLD/components/Cells/BalanceCell";
import { CounterValueCell } from "LLD/components/Cells/CounterValueCell";
import { getAddressDirection } from "../utils/getOperationCounterpartyAddress";
import { OperationCounterpartyLabel } from "./OperationCounterpartyLabel";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { UnreadIndicator } from "LLD/components/UnreadIndicator";
import type { OperationRow as OperationRowType } from "../types";

type OperationRowProps = {
  readonly row: OperationRowType;
  readonly onRowClick: (row: OperationRowType) => void;
};

function OperationRow({ row, onRowClick }: OperationRowProps) {
  const { t } = useTranslation();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const handleClick = useCallback(() => onRowClick(row), [onRowClick, row]);
  const item = row.original;
  const { operation, currency, amount, address, type, isUnread } = item;

  const typeLabel = operation.hasFailed
    ? t("operationDetails.failed")
    : t(`operation.type.${operation.type}`);

  const direction = getAddressDirection(type);
  const addressPrefix = address ? t(`history.address.${direction}`) : undefined;

  const cryptoCurrency: CryptoCurrency | TokenCurrency | undefined =
    currency.type === "FiatCurrency" ? undefined : currency;
  const isToken = cryptoCurrency?.type === "TokenCurrency";
  const iconCurrency =
    isToken && shouldDisplayAggregatedAssets ? cryptoCurrency.parentCurrency : cryptoCurrency;
  const iconNetwork =
    isToken && !shouldDisplayAggregatedAssets ? cryptoCurrency.parentCurrency.id : undefined;

  return (
    <TableRow clickable onClick={handleClick} data-testid={`history-operation-row-${operation.id}`}>
      <TableCell data-testid="history-operation-type">
        <TableCellContent
          leadingContent={
            shouldDisplayAggregatedAssets && cryptoCurrency ? (
              <CryptoIcon
                ledgerId={cryptoCurrency.id}
                ticker={cryptoCurrency.ticker}
                size={getValidCryptoIconSize(32)}
              />
            ) : (
              <CryptoCurrencyIcon currency={currency} size={32} />
            )
          }
          title={
            <div className="inline-flex items-center gap-12">
              {typeLabel}
              {isUnread && <UnreadIndicator />}
            </div>
          }
        />
      </TableCell>
      <TableCell align="end" data-testid="history-operation-address">
        <TableCellContent
          align="end"
          title={
            <div className="inline-flex items-center gap-4">
              <OperationCounterpartyLabel item={item} prefix={addressPrefix} />
              {iconCurrency && (
                <SquaredCryptoIcon
                  ledgerId={iconCurrency.id}
                  ticker={iconCurrency.ticker}
                  size={20}
                  network={iconNetwork}
                />
              )}
            </div>
          }
        />
      </TableCell>
      <TableCell align="end" data-testid="history-operation-amount">
        <BalanceCell
          currency={currency}
          balance={amount}
          alwaysShowSign
          className={amount.isNegative() ? "text-base" : "text-success"}
        />
      </TableCell>
      <TableCell align="end" data-testid="history-operation-value">
        <CounterValueCell
          currency={currency}
          balance={amount}
          date={operation.date}
          alwaysShowSign
          className="text-base"
        />
      </TableCell>
    </TableRow>
  );
}

const MemoizedOperationRow = memo(OperationRow);
export { MemoizedOperationRow as OperationRow };
