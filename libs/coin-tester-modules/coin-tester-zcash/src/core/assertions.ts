import { BigNumber } from "bignumber.js";
import type { ZcashAccount } from "@ledgerhq/coin-bitcoin/types";

export type AssertionResult = {
  name: string;
  expected: string;
  actual: string;
  pass: boolean;
};

export interface AssertionOptions {
  assertShieldedBalance?: string;
  assertTransparentBalance?: string;
  assertAvailableBalance?: string;
  assertOperationsCount?: number;
  assertShieldedTxCount?: number;
}

function satoshiToZec(satoshis: BigNumber): string {
  return satoshis.dividedBy(1e8).toFixed(8);
}

export function runAssertions(
  account: Partial<ZcashAccount>,
  opts: AssertionOptions,
): AssertionResult[] {
  const results: AssertionResult[] = [];

  if (opts.assertTransparentBalance !== undefined) {
    // account.balance = transparent + shielded; subtract shielded to get transparent only
    const privateInfo = account.privateInfo;
    const shielded = privateInfo
      ? (privateInfo.orchardBalance ?? new BigNumber(0)).plus(
          privateInfo.saplingBalance ?? new BigNumber(0),
        )
      : new BigNumber(0);
    const actual = satoshiToZec((account.balance ?? new BigNumber(0)).minus(shielded));
    results.push({
      name: "transparentBalance",
      expected: opts.assertTransparentBalance,
      actual,
      pass: actual === opts.assertTransparentBalance,
    });
  }

  if (opts.assertShieldedBalance !== undefined) {
    const privateInfo = account.privateInfo;
    const shielded = privateInfo
      ? (privateInfo.orchardBalance ?? new BigNumber(0)).plus(
          privateInfo.saplingBalance ?? new BigNumber(0),
        )
      : new BigNumber(0);
    const actual = satoshiToZec(shielded);
    results.push({
      name: "shieldedBalance",
      expected: opts.assertShieldedBalance,
      actual,
      pass: actual === opts.assertShieldedBalance,
    });
  }

  if (opts.assertAvailableBalance !== undefined) {
    // account.balance = transparent + shielded (total); available = total
    const actual = satoshiToZec(account.balance ?? new BigNumber(0));
    results.push({
      name: "availableBalance",
      expected: opts.assertAvailableBalance,
      actual,
      pass: actual === opts.assertAvailableBalance,
    });
  }

  if (opts.assertOperationsCount !== undefined) {
    const actual = account.operationsCount ?? account.operations?.length ?? 0;
    results.push({
      name: "operationsCount",
      expected: String(opts.assertOperationsCount),
      actual: String(actual),
      pass: actual === opts.assertOperationsCount,
    });
  }

  if (opts.assertShieldedTxCount !== undefined) {
    const actual = account.privateInfo?.transactions?.length ?? 0;
    results.push({
      name: "shieldedTxCount",
      expected: String(opts.assertShieldedTxCount),
      actual: String(actual),
      pass: actual === opts.assertShieldedTxCount,
    });
  }

  return results;
}

export function formatAssertionResults(results: AssertionResult[]): string {
  return results
    .map(r => `  ${r.pass ? "✓" : "✗"} ${r.name}: expected=${r.expected} actual=${r.actual}`)
    .join("\n");
}

export function allPassed(results: AssertionResult[]): boolean {
  return results.every(r => r.pass);
}
