import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { StacksTxData } from "@ledgerhq/coin-stacks/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

/**
 * Stacks SIP-010 tokens are keyed in the registry by the same composite
 * `"ADDRESS.CONTRACT::ASSET"` string `coin-stacks`'s `getBalance`/`listOperations` already
 * populate `assetReference` with (matching the legacy bridge's `network/transformers.ts`), so no
 * extra parsing is needed here -- unlike VeChain's single bare-address VTHO lookup, this is a
 * plain string passthrough that happens to work for any number of tokens.
 */
export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !asset.assetReference) {
    return undefined;
  }
  return getCryptoAssetsStore().findTokenByAddressInCurrency(asset.assetReference, currency.id);
}

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: "token",
    // NOT lowercased, deliberately: unlike `getBalance`/`listOperations`'s own composite string
    // (used only as a matchable identifier), this `assetReference` is also split back into a real
    // on-chain contract address by `buildUnsignedTx.ts`'s `parseSip010AssetReference` when crafting
    // an actual transfer -- a Stacks c32 address is only valid in its canonical case (decoding
    // requires the literal "S" prefix), so lowercasing it here would break every real send. Callers
    // that only need to *match* this reference against `getBalance`'s lowercased one compare
    // case-insensitively instead (`resolveAmount`, `validateIntent`'s `spendable`, `buildSubAccounts`,
    // `getAccountShape`'s vanished-token detection).
    assetReference: token.contractAddress,
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}

/**
 * `StakingTransactionIntent` has no generic field for pox-5's `numCycles`/`startBurnHt` (a lock
 * duration and eligibility height with no equivalent in any other chain's staking model) --
 * `GenericTransaction.familySpecificData` (ADR-047) is exactly the escape hatch for this: carried
 * verbatim from the transaction into `StacksTxData` here, then read back by
 * `buildUnsignedTx.ts`'s `buildStaking` for the `delegate` branch. `undelegate` needs neither
 * field (`buildStaking` resolves the existing stake's signer-manager itself), so an absent/partial
 * `familySpecificData` is fine there.
 */
export function buildIntentData(transaction: Record<string, unknown>): StacksTxData {
  const familySpecificData = transaction.familySpecificData as Record<string, unknown> | undefined;
  const numCycles = familySpecificData?.numCycles;
  const startBurnHt = familySpecificData?.startBurnHt;
  const signerCalldata = familySpecificData?.signerCalldata;

  return {
    type: "stacks-pox",
    numCycles: typeof numCycles === "number" ? numCycles : undefined,
    startBurnHt: typeof startBurnHt === "number" ? startBurnHt : undefined,
    signerCalldata: typeof signerCalldata === "string" ? signerCalldata : undefined,
  };
}

export default function stacksBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    buildIntentData,
  };
}
