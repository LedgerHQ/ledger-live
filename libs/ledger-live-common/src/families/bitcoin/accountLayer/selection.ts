import { BigNumber } from "bignumber.js";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountLayerDependencies } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { AccountNeedResync } from "@ledgerhq/wallet-btc/errors";
import { CoinSelect } from "@ledgerhq/wallet-btc/pickingstrategies/CoinSelect";
import { Custom } from "@ledgerhq/wallet-btc/pickingstrategies/Custom";
import { DeepFirst } from "@ledgerhq/wallet-btc/pickingstrategies/DeepFirst";
import { Merge } from "@ledgerhq/wallet-btc/pickingstrategies/Merge";
import type { PickingStrategy } from "@ledgerhq/wallet-btc/pickingstrategies/types";
import type { Output } from "@ledgerhq/wallet-btc/storage/types";
import type { OutputInfo } from "@ledgerhq/wallet-btc/types";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import {
  REPLACE_CANCEL,
  REPLACE_SPEEDUP,
  type BitcoinDerivationMode,
  type BitcoinFeeParameters,
  type BitcoinIntentInput,
  type BitcoinTxData,
} from "@ledgerhq/coin-bitcoin/api";
import {
  bitcoinPickingStrategy,
  getFamilySpecificData,
  getUtxoStrategy,
  type BitcoinAccount,
  type BitcoinAccountAddress,
  type BitcoinOutput,
  type BtcOperationExtra,
  type Transaction,
  type UtxoStrategy,
} from "../types";
import {
  CHANGE_CHAIN,
  accountPathOf,
  addressDeriver,
  addressPath,
  cryptoFor,
  toWalletDerivationMode,
} from "./derivation";
import { displayAddress } from "./interpret";
import { readAccountState } from "./state";

type Intent = TransactionIntent<any, any> & { data?: BitcoinTxData };

const STRATEGIES: Record<
  number,
  new (...args: ConstructorParameters<typeof DeepFirst>) => PickingStrategy
> = {
  [bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST]: DeepFirst,
  [bitcoinPickingStrategy.OPTIMIZE_SIZE]: CoinSelect,
  [bitcoinPickingStrategy.MERGE_OUTPUTS]: Merge,
  [bitcoinPickingStrategy.CUSTOM]: Custom,
};

/** Segwit addresses are accepted case-insensitively from the user but only valid lowercase. */
const normalizeRecipient = (recipient: string): string =>
  recipient.toLowerCase().startsWith("bc1") ? recipient.toLowerCase() : recipient;

/** Outpoints, "txid-index", the account's operations already spend without being confirmed. */
function committedInputs(operations: Operation[]): Set<string> {
  const outpoints = new Set<string>();
  for (const op of operations) {
    for (const input of (op.extra as BtcOperationExtra | undefined)?.inputs ?? [])
      outpoints.add(input);
  }
  return outpoints;
}

/**
 * The UTXOs coin selection may pick (coin-bitcoin's `getUTXOStatus` rule): confirmed ones, or
 * unconfirmed change; never one the user excluded, nor one a not yet synced send already spends.
 */
function candidates(account: BitcoinAccount, utxoStrategy: UtxoStrategy): BitcoinOutput[] {
  const committed = committedInputs(account.pendingOperations);
  return (account.bitcoinResources?.utxos ?? []).filter(
    utxo =>
      (!!utxo.blockHeight || utxo.isChange) &&
      !utxoStrategy.excludeUTXOs.some(
        e => e.hash === utxo.hash && e.outputIndex === utxo.outputIndex,
      ) &&
      !committed.has(`${utxo.hash}-${utxo.outputIndex}`),
  );
}

const toWalletOutput = (utxo: BitcoinOutput): Output => ({
  value: utxo.value.toFixed(),
  address: utxo.address ?? "",
  output_hash: utxo.hash,
  output_index: utxo.outputIndex,
  block_height: utxo.blockHeight ?? null,
  rbf: utxo.rbf,
});

type AccountContext = {
  account: BitcoinAccount;
  currencyId: string;
  derivationMode: BitcoinDerivationMode;
  accountPath: string;
  /** Display address (what `BitcoinOutput.address` holds) → address of the account. */
  addressByDisplay: Map<string, BitcoinAccountAddress>;
};

function accountContext(
  account: BitcoinAccount,
): AccountContext & { addresses: BitcoinAccountAddress[] } {
  const state = readAccountState(account.bitcoinResources?.accountState);
  if (!state) throw new AccountNeedResync();
  const currencyId = account.currency.id;
  return {
    account,
    currencyId,
    derivationMode: toWalletDerivationMode(account.derivationMode),
    accountPath: accountPathOf(account.freshAddressPath),
    addresses: state.addresses,
    addressByDisplay: new Map(state.addresses.map(a => [displayAddress(currencyId, a.address), a])),
  };
}

function toIntentInput(
  ctx: AccountContext,
  {
    txid,
    vout,
    value,
    address,
    blockHeight,
  }: { txid: string; vout: number; value?: string; address: string; blockHeight?: number | null },
): BitcoinIntentInput {
  const owner = ctx.addressByDisplay.get(displayAddress(ctx.currencyId, address));
  if (!owner) {
    throw new Error(`Input ${txid}:${vout} is not controlled by the account (${address})`);
  }
  return {
    txid,
    vout,
    address: owner.address,
    path: addressPath(ctx.accountPath, owner.chain, owner.index),
    ...(value === undefined ? {} : { value }),
    ...(blockHeight === undefined ? {} : { blockHeight }),
  };
}

/** The next change address, after the highest one holding history (wallet-btc `getNewAddress(1, 1)`). */
async function nextChange(
  ctx: AccountContext & { addresses: BitcoinAccountAddress[] },
): Promise<{ address: string; path: string }> {
  const highest = ctx.addresses
    .filter(a => a.chain === CHANGE_CHAIN)
    .reduce((max, a) => Math.max(max, a.index), -1);
  const index = highest + 1;
  const xpub = decodeAccountId(ctx.account.id).xpubOrAddress;
  const address = await addressDeriver(
    ctx.currencyId,
    ctx.derivationMode,
    xpub,
  )(CHANGE_CHAIN, index);
  return { address, path: addressPath(ctx.accountPath, CHANGE_CHAIN, index) };
}

/** The account's next change address — where a cancel sends the funds back. */
export const getNextChangeAddress = (
  account: BitcoinAccount,
): Promise<{ address: string; path: string }> => nextChange(accountContext(account));

/** The addresses of the account, as shown (`BitcoinOutput.address`). */
export function getOwnDisplayAddresses(account: BitcoinAccount): Set<string> {
  return new Set(accountContext(account).addressByDisplay.keys());
}

function selectInputs(
  ctx: AccountContext,
  utxoStrategy: UtxoStrategy,
  intent: Intent,
  feePerByte: number,
): BitcoinOutput[] {
  const pool = candidates(ctx.account, utxoStrategy);
  const crypto = cryptoFor(ctx.currencyId);
  const safeFeePerByte = Math.max(1, Math.ceil(feePerByte));

  if (intent.useAllAmount) {
    // send-max spends every UTXO worth more than what adding it costs
    const fixed = maxTxVBytesCeil(0, [], false, crypto, ctx.derivationMode);
    const oneInput = maxTxVBytesCeil(1, [], false, crypto, ctx.derivationMode) - fixed;
    return pool.filter(utxo => utxo.value.minus(safeFeePerByte * oneInput).gt(0));
  }

  let recipientScript: Buffer;
  try {
    recipientScript = crypto.toOutputScript(intent.recipient);
  } catch {
    return []; // the recipient is still being typed, validation reports it
  }
  const outputs: OutputInfo[] = [];
  const opReturn = intent.data?.opReturnData;
  if (opReturn) {
    outputs.push({
      script: crypto.toOpReturnOutputScript(Buffer.from(opReturn, "hex")),
      value: new BigNumber(0),
      address: null,
      isChange: false,
    });
  }
  outputs.push({
    script: recipientScript,
    value: new BigNumber(intent.amount.toString()),
    address: intent.recipient,
    isChange: false,
  });

  const Strategy = STRATEGIES[utxoStrategy.strategy];
  if (!Strategy) throw new Error("Unsupported Bitcoin UTXO picking strategy");
  const strategy = new Strategy(crypto, ctx.derivationMode, utxoStrategy.excludeUTXOs);
  try {
    const { unspentUtxos } = strategy.selectFromUtxos(
      pool.map(toWalletOutput),
      outputs,
      feePerByte,
    );
    const picked = new Set(unspentUtxos.map(u => `${u.output_hash}:${u.output_index}`));
    return pool.filter(utxo => picked.has(`${utxo.hash}:${utxo.outputIndex}`));
  } catch (error) {
    // Not enough funds: no input, which validation reports as NotEnoughBalance.
    if ((error as Error)?.name === "NotEnoughBalance") return [];
    throw error;
  }
}

/** Pending transactions of the account, other than `txid`, spending one of `outpoints`. */
export function conflictingTxIds(account: Account, txid: string, outpoints: Set<string>): string[] {
  const pending = [
    ...account.pendingOperations,
    ...account.operations.filter(op => op.blockHeight === null || op.blockHeight === undefined),
  ];
  const ids = new Set<string>();
  for (const op of pending) {
    if (!op.hash || op.hash === txid) continue;
    const inputs = (op.extra as BtcOperationExtra | undefined)?.inputs ?? [];
    if (inputs.some(input => outpoints.has(input))) ids.add(op.hash);
  }
  return [...ids];
}

/** The intent type of a transaction: a replacement speeds up, or cancels when it pays the account back. */
export function computeIntentType(transaction: Record<string, unknown>): string {
  const data = getFamilySpecificData(transaction as Transaction);
  if (!data.replaceTxId) return "send";
  return data.changeAddress && (transaction as Transaction).recipient === data.changeAddress
    ? REPLACE_CANCEL
    : REPLACE_SPEEDUP;
}

/**
 * Adds to an intent what only the account knows (ADR-065): the inputs — coin selection with the
 * user's strategy and exclusions, or the replaced transaction's inputs — their signing paths, and
 * the change address.
 */
export async function completeIntent(
  intent: Intent,
  account: Account,
  transaction: Record<string, unknown>,
  { api, context }: AccountLayerDependencies,
): Promise<Intent> {
  const ctx = accountContext(account as BitcoinAccount);
  const familyData = getFamilySpecificData(transaction as Transaction);
  const change = await nextChange(ctx);
  if (familyData.changeAddress && familyData.changeAddress !== change.address) {
    throw new Error("Invalid change address");
  }

  const base: Intent = {
    ...intent,
    recipient: normalizeRecipient(intent.recipient),
    data: { ...(intent.data ?? {}), type: "bitcoin", derivationMode: ctx.derivationMode, change },
  };

  if (familyData.replaceTxId) {
    const replaced = await api.estimateFees(context, {
      ...base,
      data: { ...base.data, replacement: { txid: familyData.replaceTxId } },
    });
    const parameters = (replaced.parameters ?? {}) as Partial<BitcoinFeeParameters>;
    const replacedInputs = parameters.replacedInputs ?? [];
    const inputs = replacedInputs.map(input =>
      toIntentInput(ctx, {
        txid: input.txid,
        vout: input.vout,
        value: input.value.toString(),
        address: input.address ?? "",
      }),
    );
    const outpoints = new Set(replacedInputs.map(input => `${input.txid}-${input.vout}`));
    return {
      ...base,
      data: {
        ...base.data,
        inputs,
        replacement: {
          txid: familyData.replaceTxId,
          conflictingTxIds: conflictingTxIds(account, familyData.replaceTxId, outpoints),
        },
      },
    };
  }

  const feePerByte =
    base.data?.feePerByte ??
    (
      (
        await api.estimateFees(context, base, {
          customFeesParameters: {
            feesStrategy: (transaction as Transaction).feesStrategy ?? undefined,
          },
        })
      ).parameters?.feePerByte as bigint | undefined
    )?.toString();

  const inputs = selectInputs(
    ctx,
    getUtxoStrategy(transaction as Transaction),
    base,
    Number(feePerByte ?? 0),
  ).map(utxo =>
    toIntentInput(ctx, {
      txid: utxo.hash,
      vout: utxo.outputIndex,
      value: utxo.value.toFixed(),
      address: utxo.address ?? "",
      blockHeight: utxo.blockHeight ?? null,
    }),
  );

  return { ...base, data: { ...base.data, inputs } };
}
