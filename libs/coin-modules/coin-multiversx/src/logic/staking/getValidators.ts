import type { Cursor, Page, Validator } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import type { MultiversXNetworkApi } from "../../network/api";
import type { MultiversXProvider } from "../../types";

// Parse a numeric string (atomic-unit stake) to bigint, falling back to 0 on any
// unparseable value so a single malformed provider can't break the list.
function safeStakeToBigInt(value: string | undefined): bigint {
  if (!value) return 0n;
  const n = new BigNumber(value);
  return n.isFinite() ? BigInt(n.toFixed(0)) : 0n;
}

function providerToValidator(provider: MultiversXProvider): Validator {
  return {
    address: provider.contract,
    name: provider.identity?.name ?? provider.contract,
    description: provider.identity?.description,
    url: provider.identity?.url,
    logo: provider.identity?.avatar,
    balance: safeStakeToBigInt(provider.totalActiveStake),
    commissionRate: provider.serviceFee,
    apy: provider.aprValue,
  };
}

/**
 * Returns all MultiversX staking providers (validators).
 */
export async function getValidators(
  api: MultiversXNetworkApi,
  _cursor?: Cursor,
): Promise<Page<Validator>> {
  const providers = await api.getProviders();
  const items = (providers ?? []).filter(p => !p.disabled).map(providerToValidator);

  return { items, next: undefined };
}
