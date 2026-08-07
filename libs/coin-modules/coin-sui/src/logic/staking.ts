import { Cursor, Page, Stake, Reward } from "@ledgerhq/coin-module-framework/api/types";
import * as sdk from "../network";
import { toStakes } from "../network/sdk";
import type { SuiCoinConfig } from "../config";

export const getStakes = (
  address: string,
  _cursor?: Cursor,
  currencyId?: string,
  config?: SuiCoinConfig,
): Promise<Page<Stake>> => {
  return sdk
    .getDelegatedStakes(address, currencyId, config)
    .then(delegations => ({ items: delegations.flatMap(d => toStakes(address, d)) }));
};

export const getRewards = (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
  throw new Error("getRewards is not supported");
};
