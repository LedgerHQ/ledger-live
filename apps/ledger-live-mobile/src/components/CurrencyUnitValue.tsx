import React, { useContext } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { useLocale } from "../context/Locale";
import DiscreetModeContext from "../context/DiscreetModeContext";
import { discreetModeSelector } from "../reducers/settings";

export type Props = {
  unit: Unit;
  value?: BigNumber | number | null;
  showCode?: boolean;
  alwaysShowSign?: boolean;
  alwaysShowValue?: boolean;
  before?: string;
  after?: string;
  disableRounding?: boolean;
  joinFragmentsSeparator?: string;
};

const CurrencyUnitValue = ({
  unit,
  value: valueProp,
  showCode = true,
  alwaysShowSign,
  alwaysShowValue,
  before = "",
  after = "",
  disableRounding = false,
  joinFragmentsSeparator = "",
}: Props): JSX.Element => {
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);
  const shouldApplyDiscreetMode = useContext(DiscreetModeContext);
  const value = valueProp
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
              alwaysShowSign,
              locale: loc,
              disableRounding,
              discreet: !alwaysShowValue && shouldApplyDiscreetMode && discreet,
              joinFragmentsSeparator,
            })
          : "") +
        after}
    </>
  );
};

export default CurrencyUnitValue;
