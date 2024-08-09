import React, { ElementType, ReactNode } from "react";
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
  component?: ElementType;
} & RestProps;

const DefaultRender = ({ children }: { children: ReactNode }) => <>{children}</>;

const CurrencyUnitValue = ({
  unit,
  value,
  before = "",
  after = "",
  component: Component = DefaultRender,
  ...rest
}: Props) => {
  const locale = useSelector(localeSelector);
  const formattedValue =
    before +
    formatCurrencyUnit(unit, value, {
      ...rest,
      locale,
    }) +
    after;

  return <Component>{formattedValue}</Component>;
};

export default CurrencyUnitValue;
