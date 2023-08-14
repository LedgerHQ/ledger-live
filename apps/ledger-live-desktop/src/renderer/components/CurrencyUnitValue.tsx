import React from "react";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";
import {
  formatCurrencyUnit,
  formatCurrencyUnitOptions,
} from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";

type RestProps = formatCurrencyUnitOptions;

type Props = {
  unit: Unit;
  value: BigNumber;
  before?: string;
  after?: string;
} & RestProps;

const CurrencyUnitValue = ({ unit, value, before = "", after = "", ...rest }: Props) => {
  const locale = useSelector(localeSelector);
  return (
    <>
      {before +
        formatCurrencyUnit(unit, value, {
          ...rest,
          locale,
        }) +
        after}
    </>
  );
};
export default CurrencyUnitValue;
