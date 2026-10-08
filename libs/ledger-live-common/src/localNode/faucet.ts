import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getLocalNodeCurrencies } from ".";
import { getLocalNodeTokens } from "./tokens";

/** coin-sandbox's airdrop server, `src/server.ts`. */
export const LOCAL_NODE_FAUCET_URL = "http://localhost:8000";

/** Whole units claimed at once: enough for any account reserve and plenty of fees. */
export const LOCAL_NODE_CLAIM_AMOUNT = 100;

/** What the airdrop server needs to fund an account. */
export type LocalNodeClaim = {
  family: string;
  network: string;
  address: string;
  /** An EVM token to claim instead of the native coin. */
  contractAddress?: string;
  /** A Stellar token of the local issuer to claim instead of lumens. */
  assetCode?: string;
  /** A TRC10 to claim instead of TRX, by its asset id. */
  tokenId?: string;
};

/**
 * What to claim for `account`, `undefined` when there is nothing to claim: its currency does not
 * run on a local node, or it is a token the local node cannot mint.
 */
export function getLocalNodeClaim(
  account: AccountLike,
  parentAccount?: Account | null,
): LocalNodeClaim | undefined {
  const { currency, freshAddress } = getMainAccount(account, parentAccount);
  if (!getLocalNodeCurrencies().includes(currency.id)) return undefined;

  const claim = { family: currency.family, network: currency.id, address: freshAddress };
  if (account.type !== "TokenAccount") return claim;

  const { token } = account;
  switch (currency.family) {
    // The fork deals any ERC-20 by writing its balance
    case "evm":
      return { ...claim, contractAddress: token.contractAddress };
    // Only the local issuer's tokens can be minted
    case "stellar": {
      const local = getLocalNodeTokens(currency.id).find(({ id }) => id === token.id);
      return local ? { ...claim, assetCode: local.tokenIdentifier } : undefined;
    }
    // The local node mints its own TRC10 and TRC20; it refuses any other token
    case "tron": {
      const trc10Id = token.id.match(/^tron\/trc10\/(\d+)$/)?.[1];
      if (trc10Id) return { ...claim, tokenId: trc10Id };
      return token.tokenType === "trc20"
        ? { ...claim, contractAddress: token.contractAddress }
        : undefined;
    }
    default:
      return undefined;
  }
}

/** Has the airdrop server fund the account; resolves to the funding transaction's hash. */
export async function claimLocalNodeFunds(
  { family, ...body }: LocalNodeClaim,
  amount: number = LOCAL_NODE_CLAIM_AMOUNT,
): Promise<string> {
  const response = await fetch(`${LOCAL_NODE_FAUCET_URL}/${family}/airdrop`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, amount }),
  });
  const result: { txHash?: string; error?: string } = await response.json();
  if (!response.ok || !result.txHash) {
    throw new Error(result.error ?? `Airdrop failed with HTTP ${response.status}`);
  }
  return result.txHash;
}
