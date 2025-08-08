import { Cursor, Page, Stake, Reward } from "@ledgerhq/coin-framework/api/types";
import * as sdk from "../network";

export const getStakes = (address: string, _cursor?: Cursor): Promise<Page<Stake>> => {
  return sdk.getStakes(address).then(stakes => ({ items: stakes }));
};

export const getRewards = (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
  throw new Error("getRewards is not supported");
};
