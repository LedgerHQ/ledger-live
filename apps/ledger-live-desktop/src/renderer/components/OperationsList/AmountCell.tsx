import React, { PureComponent } from "react";
import styled from "styled-components";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import { colors } from "~/renderer/styles/theme";
import { getLLDCoinFamily } from "~/renderer/families";

const Cell = styled(Box).attrs(() => ({
  px: 4,
  horizontal: false,
  alignItems: "flex-end",
}))`
  flex: 0 0 auto;
  text-align: right;
  justify-content: center;
  height: 32px;
  min-width: 150px;
`;
type Props = {
  operation: Operation;
  currency: Currency;
  unit: Unit;
  isConfirmed: boolean;
};
class AmountCell extends PureComponent<Props> {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { currency, unit, operation, isConfirmed } = this.props;
    const amount = getOperationAmountNumber(operation);

    const cryptoCurrency = "family" in currency && currency.family ? currency : null;
    const specific = cryptoCurrency ? getLLDCoinFamily(cryptoCurrency.family) : null;
    const amountCellExtra = specific?.operationDetails?.amountCellExtra;
    const Element = amountCellExtra ? amountCellExtra[operation.type] : null;
    const amountCell = specific?.operationDetails?.amountCell;
    const AmountElement = amountCell ? amountCell[operation.type] : null;

    return (
      <>
        {Element && cryptoCurrency && (
          <Cell>
            <Element operation={operation} unit={unit} currency={cryptoCurrency} />
          </Cell>
        )}
        {(!amount.isZero() || AmountElement) && (
          <Cell>
            {AmountElement && cryptoCurrency ? (
              <AmountElement
                amount={amount}
                operation={operation}
                unit={unit}
                currency={cryptoCurrency}
              />
            ) : (
              <>
                <FormattedVal
                  val={amount}
                  unit={unit}
                  showCode
                  fontSize={4}
                  alwaysShowSign
                  color={
                    !isConfirmed && operation.type === "IN"
                      ? colors.warning
                      : amount.isNegative()
                      ? "palette.text.shade80"
                      : undefined
                  }
                />

                <CounterValue
                  color="palette.text.shade60"
                  fontSize={3}
                  alwaysShowSign
                  date={operation.date}
                  currency={currency}
                  value={amount}
                />
              </>
            )}
          </Cell>
        )}
      </>
    );
  }
}
export default AmountCell;
