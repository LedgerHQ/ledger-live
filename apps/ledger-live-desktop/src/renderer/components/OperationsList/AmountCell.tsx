import React, { PureComponent } from "react";
import styled from "styled-components";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import { colors } from "~/renderer/styles/theme";
import perFamilyOperationDetails from "~/renderer/generated/operationDetails";
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

    const specific =
      "family" in currency && currency.family
        ? perFamilyOperationDetails[currency.family as keyof typeof perFamilyOperationDetails]
        : null;
    const Element =
      specific && "amountCellExtra" in specific && specific.amountCellExtra
        ? specific.amountCellExtra[operation.type as keyof typeof specific.amountCellExtra]
        : null;
    const AmountElement =
      specific && "amountCell" in specific && specific.amountCell
        ? specific.amountCell[operation.type as keyof typeof specific.amountCell]
        : null;
    return (
      <>
        {Element && (
          <Cell>
            {/* @ts-expect-error TODO: check why TS is unable to reconciliate Element as a react component */}
            <Element operation={operation} unit={unit} currency={currency} />
          </Cell>
        )}
        {(!amount.isZero() || AmountElement) && (
          <Cell>
            {AmountElement ? (
              <AmountElement
                // @ts-expect-error TODO: double check if any of the families have a component accepting an amount prop
                amount={amount}
                operation={operation}
                unit={unit}
                currency={currency}
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
