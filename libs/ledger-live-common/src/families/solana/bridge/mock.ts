/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { ChainAPI, Config, getChainAPI, logged } from "@ledgerhq/coin-solana/network/index";
import { getEnv } from "@shared/env";
import { Functions } from "@ledgerhq/coin-solana/utils";
import { Message, MessageV0 } from "@solana/web3.js";
import { flow, isArray, isEqual, isObject, isUndefined, mapValues, omitBy } from "lodash/fp";
import { getMockedMethods } from "./mock-data";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { NotEnoughBalance, RecipientRequired } from "@ledgerhq/ledger-wallet-framework/errors";
import { getSerializedAddressParameters } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { SOLANA_DUMMY_ADDRESS } from "@ledgerhq/coin-solana/constants";
import { craftTransaction } from "@ledgerhq/coin-solana/logic/craftTransaction";
import { combine } from "@ledgerhq/coin-solana/logic/combine";
import {
  broadcast,
  makeAccountBridgeReceive,
  scanAccounts,
  sync,
} from "../../../bridge/mockHelpers";
import { validateAddress } from "../../../bridge/validateAddress";
import { computeIntentType } from "./api";
import accountRawAssign from "../accountRawAssign";
import type { Transaction } from "../types";

function mockChainAPI(config: Config): ChainAPI {
  const mockedMethods = getMockedMethods();
  const api = new Proxy(
    { config },
    {
      get(_, propKey) {
        if (propKey in api) {
          return api[propKey];
        }
        if (propKey === "then") {
          return undefined;
        }
        const method: Functions<ChainAPI> = propKey.toString() as any;
        const mocks = mockedMethods.filter(mock => mock.method === method);
        if (mocks.length === 0) {
          throw new Error(`no mock found for api method: ${method}`);
        }
        return function (...rawArgs: unknown[]) {
          const args = preprocessArgs(method, rawArgs);
          const mock =
            mocks.find(({ params: mockArgs }) => isEqual(args)(mockArgs)) ??
            // The fee doesn't reach the signed bytes, and the recorded calls were made on
            // intermediate messages, so any recorded answer will do.
            (method === "getFeeForMessage" ? mocks[0] : undefined);
          if (mock === undefined) {
            const argsJson = JSON.stringify(args);
            throw new Error(`no mock found for api method ${method} with args ${argsJson}`);
          }
          return Promise.resolve(mock.answer);
        };
      },
    },
  );
  return api as ChainAPI;
}

function removeUndefineds(input: unknown): unknown {
  return isObject(input)
    ? isArray(input)
      ? input.map(removeUndefineds)
      : flow(omitBy(isUndefined), mapValues(removeUndefineds))(input)
    : input;
}

function preprocessArgs(method: keyof ChainAPI, args: unknown[]) {
  if (method === "getFeeForMessage") {
    // getFeeForMessage needs some args preprocessing
    if (args.length === 1 && (args[0] instanceof Message || args[0] instanceof MessageV0)) {
      return [Buffer.from(args[0].serialize()).toString("base64")];
    } else {
      throw new Error("unexpected getFeeForMessage function signature");
    }
  }
  if (method === "getSimulationComputeUnits") {
    // getSimulationComputeUnits needs args preprocessing
    // args[0] is instructions array, args[1] is payer PublicKey
    if (args.length === 2) {
      const instructions = args[0] as unknown[];
      const payer = args[1];

      // Serialize the payer PublicKey to string
      const serializedPayer = (payer as { toString?: () => string })?.toString?.() ?? payer;

      // Serialize PublicKey objects in instruction keys to strings
      const serializedInstructions =
        instructions?.map?.(instruction => {
          const inst = instruction as Record<string, unknown>;
          return {
            ...inst,
            keys:
              (inst.keys as unknown[])?.map?.(key => {
                const k = key as Record<string, unknown>;
                return {
                  ...k,
                  pubkey: (k.pubkey as { toString?: () => string })?.toString?.() ?? k.pubkey,
                };
              }) || inst.keys,
            programId:
              (inst.programId as { toString?: () => string })?.toString?.() ?? inst.programId,
          };
        }) || instructions;

      return [serializedInstructions, serializedPayer];
    }
  }
  return removeUndefineds(args);
}

const FAKE_SIGNATURE = "fakeSignatureTlaowosfpqwkpofqkpqwpoesHQv6xHyYwDsrPJvqcSKRJGBLrbE";

const mockedAPI = mockChainAPI({ endpoint: "mock" });

const receive = makeAccountBridgeReceive();

type SolanaMockBridge = AccountBridge<Transaction>;

const createTransaction = (): Transaction => ({
  family: "solana",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
});

const updateTransaction: SolanaMockBridge["updateTransaction"] = (t, patch) => ({ ...t, ...patch });

const prepareTransaction: SolanaMockBridge["prepareTransaction"] = async (_account, transaction) =>
  transaction;

const estimateMaxSpendable: SolanaMockBridge["estimateMaxSpendable"] = async ({ account }) =>
  account.balance;

const getTransactionStatus: SolanaMockBridge["getTransactionStatus"] = async (account, t) => {
  const errors: { amount?: Error; recipient?: Error } = {};
  const estimatedFees = new BigNumber(0);
  const amount = t.useAllAmount ? account.balance : new BigNumber(t.amount);
  const totalSpent = t.subAccountId ? amount : amount.plus(estimatedFees);

  if (!t.recipient && !t.raw) errors.recipient = new RecipientRequired("");
  if (totalSpent.gt(account.balance)) errors.amount = new NotEnoughBalance();

  return { errors, warnings: {}, estimatedFees, amount, totalSpent };
};

/**
 * Crafts and combines through the coin module, so a mocked signature still yields a transaction the
 * wallet API can deserialize — what `wallet-api.spec.ts` asserts.
 */
async function signWithMockedChain(
  account: Parameters<SolanaMockBridge["signOperation"]>[0]["account"],
  transaction: Transaction,
) {
  const intent = {
    intentType: "transaction" as const,
    type: computeIntentType(transaction),
    sender: account.freshAddress,
    senderPublicKey: account.freshAddress,
    recipient: transaction.recipient,
    amount: BigInt(transaction.amount.toFixed()),
    asset: { type: "native" as const },
    ...(transaction.raw ? { data: { type: "solana" as const, raw: transaction.raw } } : {}),
  };
  const { transaction: unsigned } = await craftTransaction(mockedAPI, intent as never);
  return combine(unsigned, [Buffer.from(FAKE_SIGNATURE).toString("hex")]);
}

const signOperation: SolanaMockBridge["signOperation"] = ({ account, transaction }) =>
  new Observable(o => {
    async function main() {
      o.next({ type: "device-signature-requested" });
      const signature = await signWithMockedChain(account, transaction);
      o.next({ type: "device-signature-granted" });
      o.next({
        type: "signed",
        signedOperation: {
          operation: {
            id: `${account.id}--OUT`,
            hash: "",
            type: "OUT",
            value: new BigNumber(transaction.amount),
            fee: new BigNumber(0),
            senders: [account.freshAddress],
            recipients: [transaction.recipient],
            blockHash: null,
            blockHeight: null,
            accountId: account.id,
            date: new Date(),
            extra: {},
          },
          signature,
        },
      });
    }
    main().then(
      () => o.complete(),
      e => o.error(e),
    );
  });

const signRawOperation: SolanaMockBridge["signRawOperation"] = ({ account, transaction }) =>
  signOperation({
    account,
    transaction: { ...createTransaction(), raw: transaction } as Transaction,
    deviceId: "",
  } as Parameters<SolanaMockBridge["signOperation"]>[0]);

const accountBridge: SolanaMockBridge = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  sync,
  receive,
  signOperation,
  signRawOperation,
  broadcast,
  getSerializedAddressParameters,
  validateAddress,
  getEstimationRecipient: () => SOLANA_DUMMY_ADDRESS,
  // `toAccountRaw` reads these off the bridge, so a mocked account keeps its token account state,
  // its Token-2022 extensions and its staking resources across a reload.
  ...accountRawAssign,
};

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

export default { accountBridge, currencyBridge };
