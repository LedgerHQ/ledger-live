import BigNumber from "bignumber.js";
import { Secp256k1Signature } from "@cosmjs/crypto";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { createBridges } from "@ledgerhq/coin-cosmos/bridge/index";
import resolver from "@ledgerhq/coin-cosmos/hw-getAddress";
import type { CosmosCoinConfig } from "@ledgerhq/coin-cosmos/config";
import type { CosmosSigner } from "@ledgerhq/coin-cosmos/types/signer";
import {
  CosmosCurrencyConfig,
  Transaction as CosmosTransaction,
} from "@ledgerhq/coin-cosmos/types/index";

registerCoinModules(coinModuleLoaders);

// Currencies exercised by the scenarios. Babylon (BABY) is x/epoching-wrapped;
// Cosmos Hub (ATOM) is the canonical, non-wrapped cosmos chain.
export const babylon = getCryptoCurrencyById("babylon");
export const cosmos = getCryptoCurrencyById("cosmos");

export interface CosmosBridges {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}

/**
 * Map a GenericTransaction onto the legacy Cosmos transaction.
 *
 * The legacy `delegate` build path reads `transaction.amount`, but undelegate/
 * redelegate/claimReward/compoundReward read `validators[0].amount` — so both are
 * set to the stake amount. Redelegate: `sourceValidator` = source (`valAddress`),
 * `validators[0].address` = destination (`dstValAddress`).
 */
export function genericToCosmosTransaction(gt: GenericTransaction): CosmosTransaction {
  const amount = gt.amount ?? new BigNumber(0);
  const base = {
    family: "cosmos" as const,
    amount,
    memo: gt.memoValue ?? "",
    useAllAmount: gt.useAllAmount ?? false,
    fees: null,
    gas: null,
    networkInfo: null,
  };
  const mode = gt.mode ?? "send";

  if (mode === "send")
    return {
      ...base,
      mode: "send",
      recipient: gt.recipient,
      validators: [],
    } as unknown as CosmosTransaction;

  if (mode === "redelegate")
    return {
      ...base,
      mode,
      recipient: "",
      sourceValidator: gt.valAddress,
      validators: [{ address: gt.dstValAddress ?? "", amount }],
    } as unknown as CosmosTransaction;

  // delegate / undelegate / claimReward / compoundReward
  return {
    ...base,
    mode,
    recipient: "",
    sourceValidator: undefined,
    validators: [{ address: gt.valAddress ?? "", amount }],
  } as unknown as CosmosTransaction;
}

/**
 * Wrap the Cosmos AccountBridge so it speaks GenericTransaction — letting
 * one scenario drive both the legacy and generic-adapter strategies.
 */
function adaptLegacyBridge(
  bridge: AccountBridge<CosmosTransaction>,
): AccountBridge<GenericTransaction> {
  const preparedTxMap = new WeakMap<GenericTransaction, CosmosTransaction>();

  return {
    sync: bridge.sync,
    receive: bridge.receive,
    broadcast: bridge.broadcast,
    validateAddress: bridge.validateAddress,
    getSerializedAddressParameters: bridge.getSerializedAddressParameters,
    signRawOperation: bridge.signRawOperation,
    // exactOptionalPropertyTypes rejects assigning the optional-typed
    // getEstimationRecipient straight through; forward via a non-optional closure.
    getEstimationRecipient: account => bridge.getEstimationRecipient!(account),
    createTransaction: () => ({
      family: "cosmos",
      mode: "send",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: null,
    }),
    updateTransaction: (tx, patch) => ({ ...tx, ...patch }),
    prepareTransaction: async (account, gt) => {
      const prepared = await bridge.prepareTransaction(account, genericToCosmosTransaction(gt));
      const result: GenericTransaction = {
        ...gt,
        amount: prepared.amount,
        recipient: prepared.recipient,
        fees: prepared.fees ?? null,
      };
      preparedTxMap.set(result, prepared);
      return result;
    },
    getTransactionStatus: (account, gt) =>
      bridge.getTransactionStatus(account, preparedTxMap.get(gt) ?? genericToCosmosTransaction(gt)),
    signOperation: ({ account, transaction: gt, deviceId }) =>
      bridge.signOperation({
        account,
        transaction: preparedTxMap.get(gt) ?? genericToCosmosTransaction(gt),
        deviceId,
      }),
    estimateMaxSpendable: ({ account, parentAccount, transaction: gt }) =>
      bridge.estimateMaxSpendable({
        account,
        parentAccount,
        transaction: gt ? genericToCosmosTransaction(gt) : undefined,
      }),
  };
}

/**
 * Parse a BIP32 path into the numeric-index array `CosmosSigner` expects: strips
 * the `'` hardening markers (the signer re-applies hardening on the first 3 segments).
 */
function toIndices(path: string): number[] {
  return path.split("/").map(p => parseInt(p.replace(/'/g, ""), 10));
}

type CosmosGenericSigner = {
  getAddress(path: string): Promise<{ address: string; publicKey: string }>;
  signTransaction(path: string, message: string): Promise<string>;
};

/**
 * Adapt the tester's legacy-shaped `CosmosSigner` (numeric path, DER signature) up
 * to the `getAddress`/`signTransaction` shape the generic framework's signer needs.
 *
 * Only the public key is read here (the address is derived elsewhere via the
 * top-level `getAddress`), so the hrp is a placeholder. `combine()` wants a hex
 * 64-byte (r‖s) signature + base64 pubkey, so both are re-encoded from the legacy
 * bridge's DER + raw form.
 */
function toGenericSigner(signer: CosmosSigner): CosmosGenericSigner {
  return {
    async getAddress(path) {
      const { compressed_pk } = await signer.getAddressAndPubKey(toIndices(path), "cosmos");
      return { address: "", publicKey: Buffer.from(compressed_pk).toString("base64") };
    },
    async signTransaction(path, message) {
      const { signable } = JSON.parse(message) as { signable: string };
      const { signature } = await signer.sign(toIndices(path), Buffer.from(signable, "base64"));
      if (!signature) {
        throw new Error("Cosmos tester signer returned no signature");
      }
      return Buffer.from(Secp256k1Signature.fromDer(signature).toFixedLength()).toString("hex");
    },
  };
}

/**
 * Wire the Cosmos bridges for the requested strategy, both speaking GenericTransaction.
 * `coinConfig` points the legacy bridge at the local devnet LCD; it is consulted
 * only on the "legacy" branch (the generic-adapter arm reads config from LiveConfig).
 */
export async function getBridges(
  strategy: BridgeStrategy,
  signer: CosmosSigner,
  coinConfig: CosmosCurrencyConfig & { status: { type: "active" } },
): Promise<CosmosBridges> {
  const signerContext: SignerContext<CosmosSigner> = (_deviceId, fn) => fn(signer);
  const getAddress = resolver(signerContext);

  if (strategy === "legacy") {
    const { currencyBridge, accountBridge } = createBridges(
      signerContext,
      () => coinConfig as unknown as CosmosCoinConfig,
    );
    return {
      currencyBridge,
      accountBridge: adaptLegacyBridge(
        accountBridge as unknown as AccountBridge<CosmosTransaction>,
      ),
      getAddress,
    };
  }

  const genericSigner = toGenericSigner(signer);
  const context: SignerContext<CosmosGenericSigner> = (_deviceId, fn) => fn(genericSigner);
  const customSigner = { context, getAddress };

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("cosmos", "local", customSigner),
    accountBridge: await getCoinFrameworkAccountBridge("cosmos", "local", customSigner),
    getAddress,
  };
}
