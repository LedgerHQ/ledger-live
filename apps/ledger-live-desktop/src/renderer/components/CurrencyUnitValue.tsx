import React, { ElementType, ReactNode } from "react";
import { useSelector } from "LLD/hooks/redux";
import { BigNumber } from "bignumber.js";
import type { Unit } from "@domain/entity-currency";
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
