import { Cursor, Page, Stake, Reward } from "@ledgerhq/coin-module-framework/api/types";
import * as sdk from "../network";
import { toStakes } from "../network/sdk";
import type { SuiCoinConfig } from "../config";

export const getStakes = (
  config: SuiCoinConfig,
  address: string,
  _cursor?: Cursor,
): Promise<Page<Stake>> => {
  return sdk
    .getDelegatedStakes(config, address)
    .then(delegations => ({ items: delegations.flatMap(d => toStakes(address, d)) }));
};

export const getRewards = (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
  throw new Error("getRewards is not supported");
};
