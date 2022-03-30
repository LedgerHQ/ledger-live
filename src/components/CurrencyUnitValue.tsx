import React, { useContext } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { Unit } from "@ledgerhq/live-common/lib/types";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { useLocale } from "../context/Locale";
import DiscreetModeContext from "../context/DiscreetModeContext";
import { discreetModeSelector } from "../reducers/settings";

type Props = {
  unit: Unit;
  value: BigNumber | number;
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
  const value =
    valueProp instanceof BigNumber ? valueProp : new BigNumber(valueProp);

  return (
    <>
      {before +
        (value
          ? formatCurrencyUnit(unit, value, {
              showCode,
              alwaysShowSign,
              locale,
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
