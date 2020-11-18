// @flow
import type { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import type { Unit } from "@ledgerhq/live-common/lib/types";

import { useSelector } from "react-redux";
import { useLocale } from "../context/Locale";
import { discreetModeSelector } from "../reducers/settings";

type Props = {
  unit: Unit,
  value: ?BigNumber,
  showCode?: boolean,
  alwaysShowSign?: boolean,
  before?: string,
  after?: string,
  disableRounding?: boolean,
  joinFragmentsSeparator?: string,
};

export default function CurrencyUnitValue({
  unit,
  value,
  showCode = true,
  alwaysShowSign,
  before = "",
  after = "",
  disableRounding = false,
  joinFragmentsSeparator = "",
}: Props) {
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);

  return (
    before +
    (value
      ? formatCurrencyUnit(unit, value, {
          showCode,
          alwaysShowSign,
          locale,
          disableRounding,
          discreet,
          joinFragmentsSeparator,
        })
      : "") +
    after
  );
}
