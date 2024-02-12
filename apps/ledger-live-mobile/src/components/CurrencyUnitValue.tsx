import React, { useContext } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { formatCurrencyUnitOptions } from "@ledgerhq/live-common/currencies/index";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { useLocale } from "~/context/Locale";
import DiscreetModeContext from "~/context/DiscreetModeContext";
import { discreetModeSelector } from "~/reducers/settings";

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
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);
  const shouldApplyDiscreetMode = useContext(DiscreetModeContext);
  const value =
    valueProp || valueProp === 0
      ? valueProp instanceof BigNumber
        ? valueProp
        : new BigNumber(valueProp)
      : null;

  let loc = locale;
  // TEMPORARY : quick win to transform arabic to english
  if (locale === "ar") {
    loc = "en";
  }

  return (
    <>
      {before +
        (value
          ? formatCurrencyUnit(unit, value, {
              showCode,
              locale: loc,
              discreet: !alwaysShowValue && shouldApplyDiscreetMode && discreet,
              ...otherFormatCurrencyUnitOptions,
            })
          : "") +
        after}
    </>
  );
};

export default CurrencyUnitValue;
