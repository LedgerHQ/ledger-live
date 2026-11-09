import type { AccountTarget } from "@domain/api-account-data";
import {
  SignatureMismatchError,
  type AccountSendCapability,
} from "@domain/api-account-transaction";
import { AmountStrSchema } from "@domain/entity-account-balance";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { AccountOperationSchema, TransactionHashSchema } from "@domain/entity-account-operation";
import type {
  BroadcastedTransaction,
  PreparedTransaction,
  SendRequest,
  SignedTransaction,
  TransactionIssue,
} from "@domain/entity-account-transaction";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { bytesToHex } from "@noble/hashes/utils.js";
import { concat, defer, of, timer } from "rxjs";
import { map } from "rxjs/operators";
import { familyOf } from "./families";
import { kinds } from "./kinds";
import { operationCountOf } from "./operationCounts";
import { randomBytes, seededRandom } from "./random";

/** As long as a user would take to approve on a device, so the tools show each state. */
const APPROVAL_MS = 600;

const contextOf = (target: AccountTarget) => {
  const currency = getCryptoCurrencyById(currencyIdFromNetwork(target.descriptor.network));
  const family = familyOf(currency);
  return { currency, family };
};

function balancesOf(target: AccountTarget) {
  const { currency, family } = contextOf(target);
  const reader = family.read?.balance ?? kinds.balance;
  if (!reader) throw new Error("No mock reader for balance");
  return reader(
    {
      target,
      currency,
      family,
      random: seededRandom(`${target.accountUUID}:balance`),
      balances: () => [],
      operations: () => [],
      operationCount: operationCountOf(target.accountUUID),
    },
    undefined,
  );
}

const preparationSigned = (payload: unknown) =>
  typeof payload === "object" && payload !== null && "of" in payload ? payload.of : undefined;

/** A fixed fee per network: a ten-thousandth of a coin. */
const feeOf = (magnitude: number) => 10n ** BigInt(Math.max(magnitude - 4, 0));

/** Sends from the generated accounts with no network nor device: mock fees and balances, a pause to approve, a pending row. */
export const mockSender: AccountSendCapability = {
  supports: () => true,

  prepare: (target, request) => Promise.resolve().then(() => preparedFor(target, request)),

  sign: (target, prepared) =>
    concat(
      of({ type: "device-signature-requested" as const }),
      timer(APPROVAL_MS).pipe(map(() => ({ type: "device-signature-granted" as const }))),
      defer(() => {
        const random = seededRandom(`${target.accountUUID}:${JSON.stringify(prepared.payload)}`);
        const signature = `0x${bytesToHex(randomBytes(random, 65))}`;
        return of({
          type: "signed" as const,
          signed: { payload: { signature, of: prepared.payload } },
        });
      }),
    ),

  broadcast: (target, prepared, signed) =>
    Promise.resolve().then(() => broadcastedFor(target, prepared, signed)),
};

function preparedFor(target: AccountTarget, request: SendRequest): PreparedTransaction {
  const { currency } = contextOf(target);
  const fees = feeOf(currency.units[0].magnitude);
  const balances = balancesOf(target);
  const spendableOf = (assetId: string) =>
    BigInt(balances.find(row => row.assetId === assetId)?.spendableBalance ?? "0");
  const spendable = spendableOf(request.assetId);
  const native = request.assetId === currency.id;
  const maxAmount = native ? spendable - fees : spendable;
  const sendable = maxAmount > 0n ? maxAmount : 0n;
  const amount = request.useAllAmount ? sendable : BigInt(request.amount);
  const errors: TransactionIssue[] = [];
  if (request.useAllAmount && maxAmount <= 0n) {
    errors.push({ name: "NotEnoughBalance", message: "", field: "amount" });
  } else if (amount === 0n) {
    errors.push({ name: "AmountRequired", message: "", field: "amount" });
  } else if (amount > maxAmount) {
    errors.push({ name: "NotEnoughBalance", message: "", field: "amount" });
  }
  if (!native && spendableOf(currency.id) < fees) {
    errors.push({ name: "NotEnoughGas", message: "", field: "fees" });
  }
  if (request.feeAssetId !== undefined && request.feeAssetId !== currency.id) {
    errors.push({ name: "FeeAssetNotSupported", message: "", field: "fees" });
  }
  return {
    request,
    amount: AmountStrSchema.parse(amount.toString()),
    fees: AmountStrSchema.parse(fees.toString()),
    feeAssetId: currency.id,
    totalSpent: AmountStrSchema.parse((native ? amount + fees : amount).toString()),
    errors,
    warnings: [],
    payload: { nonce: bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(16))) },
  };
}

function broadcastedFor(
  target: AccountTarget,
  prepared: PreparedTransaction,
  signed: SignedTransaction,
): BroadcastedTransaction {
  if (JSON.stringify(preparationSigned(signed.payload)) !== JSON.stringify(prepared.payload)) {
    throw new SignatureMismatchError("This signature is not of this preparation");
  }
  const { currency, family } = contextOf(target);
  const random = seededRandom(`${target.accountUUID}:${JSON.stringify(signed.payload)}`);
  const hash = TransactionHashSchema.parse(`0x${bytesToHex(randomBytes(random, 32))}`);
  const { descriptor } = target;
  const own = descriptor.type === "address" ? descriptor.address : family.address(currency, random);
  const operation = AccountOperationSchema.parse({
    id: `${prepared.request.assetId}-${hash}-OUT`,
    hash,
    type: "OUT",
    assetId: prepared.request.assetId,
    value: prepared.amount,
    fee: prepared.request.assetId === currency.id ? prepared.fees : "0",
    senders: [own],
    recipients: [prepared.request.recipient],
    blockHeight: null,
    date: new Date().toISOString(),
  });
  return { hash, operations: [operation] };
}
