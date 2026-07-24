import { type Page, type Validator } from "@ledgerhq/coin-module-framework/api/index";
import { getValidators as getValidatorsFromNetwork } from "../network";

const emptyStringToUndefined = (s: string | undefined | null) => s || undefined;

export async function getValidators(
  _cursor?: string,
  currencyId?: string,
): Promise<Page<Validator>> {
  const validators = await getValidatorsFromNetwork(currencyId);

  const items: Validator[] = validators.map(v => ({
    address: v.suiAddress,
    name: v.name,
    description: emptyStringToUndefined(v.description),
    url: emptyStringToUndefined(v.projectUrl),
    logo: emptyStringToUndefined(v.imageUrl),
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
