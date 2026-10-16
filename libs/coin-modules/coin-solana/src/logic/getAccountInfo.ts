import type { ChainAPI } from "../network";
import { getTokenAccountShapes, type TokenAccountShape } from "./tokenAccountShapes";
import { toJsonSafe } from "./toJsonSafe";

/**
 * Solana account metadata exposed through the generic `getAccountInfo` contract (ADR-045):
 * `tokenAccounts` maps each held mint to its associated token account's frozen state and Token-2022
 * extensions, in JSON form.
 */
export type SolanaAccountInfo = {
  type: "solana";
  tokenAccounts: Record<string, TokenAccountShape>;
};

export async function getAccountInfo(api: ChainAPI, address: string): Promise<SolanaAccountInfo> {
  const shapes = await getTokenAccountShapes(api, address);
  // Plain data already: toJsonSafe only drops the fields left undefined.
  return { type: "solana", tokenAccounts: toJsonSafe(shapes) as Record<string, TokenAccountShape> };
}
