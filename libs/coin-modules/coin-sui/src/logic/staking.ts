import { Cursor, Page, Stake, Reward } from "@ledgerhq/coin-module-framework/api/types";
import * as sdk from "../network";
import { toStakes } from "../network/sdk";

export const getStakes = (
  address: string,
  _cursor?: Cursor,
  currencyId?: string,
): Promise<Page<Stake>> => {
  return sdk
    .getDelegatedStakes(address, currencyId)
    .then(delegations => ({ items: delegations.flatMap(d => toStakes(address, d)) }));
};

export const getRewards = (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
  throw new Error("getRewards is not supported");
};
