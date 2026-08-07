import { type Page, type Validator } from "@ledgerhq/coin-module-framework/api/index";
import { getValidators as getValidatorsFromNetwork } from "../network";
import type { SuiCoinConfig } from "../config";

export async function getValidators(
  _cursor?: string,
  currencyId?: string,
  config?: SuiCoinConfig,
): Promise<Page<Validator>> {
  const validators = await getValidatorsFromNetwork(currencyId, config);

  const items: Validator[] = validators.map(v => ({
    id: v.suiAddress,
    address: v.suiAddress,
    name: v.name,
    description: v.description,
    url: v.projectUrl,
    logo: v.imageUrl,
    balance: BigInt(v.stakingPoolSuiBalance),
    commissionRate: v.commissionRate,
    apy: v.apy,
  }));

  return {
    items,
    // there is no underlying pagination, so undefined token
    next: undefined,
  };
}
