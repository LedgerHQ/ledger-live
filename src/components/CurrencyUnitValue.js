// @flow
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import type { Unit } from "@ledgerhq/live-common/lib/types";

import { useSelector } from "react-redux";
import { useContext } from "react";
import { discreetModeSelector, localeSelector } from "../reducers/settings";
// $FlowFixMe
import DiscreetModeContext from "../context/DiscreetModeContext";

type Props = {
  unit: Unit,
  value: BigNumber | number,
  showCode?: boolean,
  alwaysShowSign?: boolean,
  alwaysShowValue?: boolean,
  before?: string,
  after?: string,
  disableRounding?: boolean,
  joinFragmentsSeparator?: string,
};

export default function CurrencyUnitValue({
  unit,
  value: valueProp,
  showCode = true,
  alwaysShowSign,
  alwaysShowValue,
  before = "",
  after = "",
  disableRounding = false,
  joinFragmentsSeparator = "",
}: Props) {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const shouldApplyDiscreetMode = useContext(DiscreetModeContext);
  const value =
    valueProp instanceof BigNumber ? valueProp : BigNumber(valueProp);

  return (
    before +
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
    after
  );
}
