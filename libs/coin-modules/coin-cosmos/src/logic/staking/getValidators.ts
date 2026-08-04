import { Cursor, Page, Validator } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosAPI } from "../../network/Cosmos";

/** Bonded validators; the LCD endpoint returns a single capped page, so `next` is always undefined. */
export async function getValidators(api: CosmosAPI, _cursor?: Cursor): Promise<Page<Validator>> {
  const validators = await api.getValidators();

  const items: Validator[] = validators.map(v => ({
    address: v.validatorAddress,
    name: v.name,
    balance: BigInt(v.tokens || "0"),
    commissionRate: String(v.commission),
    apy: v.estimatedYearlyRewardsRate,
  }));

  return { items, next: undefined };
}
