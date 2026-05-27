import type { Page, Validator } from "@ledgerhq/coin-module-framework/api/types";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";

type ValidatorRaw = {
  active_stake?: number | null;
  commission?: number | null;
  total_score?: number | null;
  vote_account?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  delinquent?: boolean | null;
  www_url?: string | null;
};

type ValidatorApyRaw = {
  address: string;
  delegator_apy: number;
  name: string;
};

export async function getValidators(validatorsUrl?: string): Promise<Page<Validator>> {
  if (!validatorsUrl) return { items: [], next: undefined };

  const [raw, apyMap] = await Promise.all([fetchValidators(validatorsUrl), fetchFigmentApy()]);
  const items = raw.flatMap(v => {
    const mapped = toValidator(v, apyMap);
    return mapped ? [mapped] : [];
  });

  return { items, next: undefined };
}

async function fetchValidators(validatorsUrl: string): Promise<ValidatorRaw[]> {
  const response = await network<ValidatorRaw[]>({ method: "GET", url: validatorsUrl });
  return response.status === 200 ? response.data : [];
}

async function fetchFigmentApy(): Promise<Record<string, number>> {
  try {
    const response = await network<ValidatorApyRaw[]>({
      method: "GET",
      url: getEnv("SOLANA_VALIDATORS_SUMMARY_BASE_URL"),
    });
    if (response.status === 200 && Array.isArray(response.data)) {
      return Object.fromEntries(
        response.data
          .filter(
            item => typeof item.address === "string" && typeof item.delegator_apy === "number",
          )
          .map(item => [item.address, item.delegator_apy]),
      );
    }
  } catch (error) {
    console.warn("Failed to fetch Figment APY", error);
  }
  return {};
}

function toValidator(raw: ValidatorRaw, apyMap: Record<string, number>): Validator | undefined {
  if (
    typeof raw.active_stake !== "number" ||
    typeof raw.commission !== "number" ||
    typeof raw.total_score !== "number" ||
    typeof raw.vote_account !== "string" ||
    raw.delinquent === true
  ) {
    return undefined;
  }
  return {
    address: raw.vote_account,
    name: raw.name ?? raw.vote_account,
    url: raw.www_url ?? undefined,
    logo: raw.avatar_url ?? undefined,
    balance: BigInt(raw.active_stake),
    commissionRate: String(raw.commission),
    apy: apyMap[raw.vote_account],
  };
}
