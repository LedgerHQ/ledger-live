import { type Page, type Validator } from "@ledgerhq/coin-framework/api/index";
import { getValidators as getValidatorsFromNetwork } from "../network";

export async function getValidators(_cursor?: string): Promise<Page<Validator>> {
  const validators = await getValidatorsFromNetwork();

  const items: Validator[] = validators.map(v => ({
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
