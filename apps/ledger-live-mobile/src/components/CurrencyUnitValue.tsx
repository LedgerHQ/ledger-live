import React, { useContext } from "react";
import type { formatCurrencyUnitOptions } from "@ledgerhq/live-common/currencies/index";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import DiscreetModeContext from "~/context/DiscreetModeContext";
import { discreetModeSelector } from "~/reducers/settings";
import useFormat from "~/hooks/useFormat";

export type CurrencyUnitValueProps = {
  unit: Unit;
  value?: BigNumber | number | null;
  alwaysShowValue?: boolean;
  before?: string;
  after?: string;
} & formatCurrencyUnitOptions;

const CurrencyUnitValue = ({
  unit,
  value: valueProp,
  showCode = true,
  alwaysShowValue,
  before = "",
  after = "",
  ...otherFormatCurrencyUnitOptions
}: CurrencyUnitValueProps): JSX.Element => {
  const { formatCurrency } = useFormat();
  const discreet = useSelector(discreetModeSelector);
  const shouldApplyDiscreetMode = useContext(DiscreetModeContext);
  const value =
    valueProp || valueProp === 0
      ? valueProp instanceof BigNumber
        ? valueProp
        : new BigNumber(valueProp)
      : null;

  // let loc = locale;
  // // TEMPORARY : quick win to transform arabic to english
  // if (locale === "ar") {
  //   loc = "en";
  // }

  return (
    <>
      {before +
        (value
          ? formatCurrency(unit, value, {
              showCode,
              discreet: !alwaysShowValue && shouldApplyDiscreetMode && discreet,
              ...otherFormatCurrencyUnitOptions,
            })
          : "") +
        after}
    </>
  );
};

export default CurrencyUnitValue;
