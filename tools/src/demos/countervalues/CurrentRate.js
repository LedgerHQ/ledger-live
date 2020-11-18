// @flow
import React from "react";
import BigNumber from "bignumber.js";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { useCalculate } from "@ledgerhq/live-common/lib/countervalues/react";

const CurrentRate = ({ from, to }: { from: Currency, to: Currency }) => {
  const value = 10 ** from.units[0].magnitude;
  const countervalue = useCalculate({ from, to, value, disableRounding: true });
  return (
    <span>
      <strong>
        {formatCurrencyUnit(from.units[0], BigNumber(value), {
          showCode: true,
        })}
      </strong>
      {" = "}
      <strong>
        {countervalue
          ? formatCurrencyUnit(to.units[0], BigNumber(countervalue), {
              showCode: true,
            })
          : "???"}
      </strong>
    </span>
  );
};

export default CurrentRate;
