import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { apiClient } from "../network/api";

export type AleoStakingPosition = {
  bondedBalance: BigNumber;
  bondedValidator: string | null;
  unbondingBalance: BigNumber;
  unbondingHeight: number | null;
};

// credits.aleo mapping values are Leo struct plaintexts, e.g.
// "{\n  validator: aleo1...,\n  microcredits: 111468399u64\n}"
const VALIDATOR_FIELD_REGEX = /validator:\s*(aleo1[0-9a-z]+)/;
const MICROCREDITS_FIELD_REGEX = /microcredits:\s*(\d+)u64/;
const HEIGHT_FIELD_REGEX = /height:\s*(\d+)u32/;

export function parseBondedMapping(
  raw: string | null,
): { validator: string; microcredits: BigNumber } | null {
  if (!raw) return null;
  const validator = VALIDATOR_FIELD_REGEX.exec(raw)?.[1];
  const microcredits = MICROCREDITS_FIELD_REGEX.exec(raw)?.[1];
  if (!validator || !microcredits) return null;
  return { validator, microcredits: new BigNumber(microcredits) };
}

export function parseUnbondingMapping(
  raw: string | null,
): { microcredits: BigNumber; height: number } | null {
  if (!raw) return null;
  const microcredits = MICROCREDITS_FIELD_REGEX.exec(raw)?.[1];
  const height = HEIGHT_FIELD_REGEX.exec(raw)?.[1];
  if (!microcredits || !height) return null;
  return { microcredits: new BigNumber(microcredits), height: Number(height) };
}

export async function getStakingPosition(
  currency: CryptoCurrency,
  address: string,
): Promise<AleoStakingPosition> {
  const [bondedRaw, unbondingRaw] = await Promise.all([
    apiClient.getBondedMapping(currency, address),
    apiClient.getUnbondingMapping(currency, address),
  ]);

  const bonded = parseBondedMapping(bondedRaw);
  const unbonding = parseUnbondingMapping(unbondingRaw);

  // Log parse failures: detect when raw data is non-null but parsing returned null
  if (bondedRaw && !bonded) {
    log("aleo/getStakingPosition", "Failed to parse bonded mapping", {
      raw: bondedRaw,
    });
  }

  if (unbondingRaw && !unbonding) {
    log("aleo/getStakingPosition", "Failed to parse unbonding mapping", {
      raw: unbondingRaw,
    });
  }

  return {
    bondedBalance: bonded?.microcredits ?? new BigNumber(0),
    bondedValidator: bonded?.validator ?? null,
    unbondingBalance: unbonding?.microcredits ?? new BigNumber(0),
    unbondingHeight: unbonding?.height ?? null,
  };
}
