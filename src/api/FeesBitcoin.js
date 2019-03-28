// @flow

// $FlowFixMe (breaks on user land side!)
import React from "react";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import type { CryptoCurrency } from "../types";
import { getEstimatedFees } from "./Fees";

export type FeeItem = {
  key: string,
  label: React$Node,
  blockCount: number,
  feePerByte: BigNumber
};

export type FeeItems = {
  items: FeeItem[],
  defaultFeePerByte: BigNumber
};

export const labels = {
  "1": <Trans i18nKey="fees.speed.high" />,
  "3": <Trans i18nKey="fees.speed.standard" />,
  "6": <Trans i18nKey="fees.speed.low" />
};

export const defaultBlockCount = 3;

export const getFeeItems = async (
  currency: CryptoCurrency
): Promise<FeeItems> => {
  let items = [];
  const fees = await getEstimatedFees(currency);
  let defaultFeePerByte = BigNumber(0);
  for (const key of Object.keys(fees)) {
    const feePerByte = BigNumber(Math.ceil(fees[key] / 1000));
    const blockCount = parseInt(key, 10);
    if (blockCount === defaultBlockCount) defaultFeePerByte = feePerByte;
    if (!Number.isNaN(blockCount) && !feePerByte.isNaN()) {
      items.push({
        key,
        label: labels[blockCount] || (
          <Trans i18nKey="fees.speed.blocks" values={{ blockCount }} />
        ),
        blockCount,
        feePerByte
      });
    }
  }
  items = items.sort((a, b) => a.blockCount - b.blockCount);
  return { items, defaultFeePerByte };
};
