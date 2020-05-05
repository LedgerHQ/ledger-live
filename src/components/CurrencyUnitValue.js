// @flow
import type { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import type { Unit } from "@ledgerhq/live-common/lib/types";

import { useLocale } from "../context/Locale";

type Props = {
  unit: Unit,
  value: ?BigNumber,
  showCode?: boolean,
  alwaysShowSign?: boolean,
  before?: string,
  after?: string,
};

export default function CurrencyUnitValue({
  unit,
  value,
  showCode = true,
  alwaysShowSign,
  before = "",
  after = "",
}: Props) {
  const { locale } = useLocale();

  return (
    before +
    formatCurrencyUnit(unit, value, {
      showCode,
      alwaysShowSign,
      locale,
    }) +
    after
  );
}
