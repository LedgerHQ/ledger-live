import type { TransactionPayloadResponse } from "@aptos-labs/ts-sdk";
import BigNumber from "bignumber.js";
import { APTOS_COIN_CHANGE, OP_TYPE } from "../../constants";
import { normalizeAddress } from "../../logic/normalizeAddress";
import {
  convertFunctionPayloadResponseToInputEntryFunctionData,
  getTransactionSender,
  transactionsToOperations,
} from "../../logic/transactionsToOperations";
import type { AptosTransaction } from "../../types";

const MULTISIG = "0x21";
const OWNER = "0x31";
const RECIPIENT = "0x12";

const transferPayload = {
  type: "entry_function_payload",
  function: "0x1::coin::transfer",
  type_arguments: [],
  arguments: [RECIPIENT, "100"],
} as const;

const multisigPayload = (transaction_payload: unknown) =>
  ({
    type: "multisig_payload",
    multisig_address: MULTISIG,
    transaction_payload,
  }) as TransactionPayloadResponse;

const multisigTransfer = (
  payload: TransactionPayloadResponse,
  recipient: string = RECIPIENT,
): AptosTransaction =>
  ({
    type: "user_transaction",
    hash: "0xmultisig",
    sender: OWNER,
    gas_used: "200",
    gas_unit_price: "100",
    success: true,
    payload,
    events: [
      {
        type: "0x1::coin::WithdrawEvent",
        guid: { account_address: MULTISIG, creation_number: "1" },
        data: { amount: "100" },
      },
      {
        type: "0x1::coin::DepositEvent",
        guid: { account_address: recipient, creation_number: "2" },
        data: { amount: "100" },
      },
    ],
    changes: [
      {
        type: "write_resource",
        data: {
          type: APTOS_COIN_CHANGE,
          data: {
            withdraw_events: { guid: { id: { addr: MULTISIG, creation_num: "1" } } },
            deposit_events: { guid: { id: { addr: recipient, creation_num: "2" } } },
          },
        },
      },
    ],
    block: { hash: "0xabc", height: 1 },
    timestamp: "1000000",
    sequence_number: "1",
  }) as unknown as AptosTransaction;

describe("convertFunctionPayloadResponseToInputEntryFunctionData", () => {
  it("maps an entry-function payload", () => {
    expect(
      convertFunctionPayloadResponseToInputEntryFunctionData(
        transferPayload as TransactionPayloadResponse,
      ),
    ).toEqual({
      function: "0x1::coin::transfer",
      typeArguments: [],
      functionArguments: [RECIPIENT, "100"],
    });
  });

  it("unwraps the entry function a multisig account executes", () => {
    expect(
      convertFunctionPayloadResponseToInputEntryFunctionData(multisigPayload(transferPayload)),
    ).toEqual({
      function: "0x1::coin::transfer",
      typeArguments: [],
      functionArguments: [RECIPIENT, "100"],
    });
  });

  it.each([
    ["a missing payload", undefined],
    [
      "a script payload",
      { type: "script_payload", code: { bytecode: "0x" }, type_arguments: [], arguments: [] },
    ],
    ["a multisig payload without inner payload", multisigPayload(undefined)],
    [
      "a multisig payload wrapping a script",
      multisigPayload({ type: "script_payload", code: { bytecode: "0x" } }),
    ],
  ])("returns undefined for %s", (_, payload) => {
    expect(
      convertFunctionPayloadResponseToInputEntryFunctionData(
        payload as TransactionPayloadResponse | undefined,
      ),
    ).toBeUndefined();
  });
});

describe("getTransactionSender", () => {
  const tx = multisigTransfer(multisigPayload(transferPayload));

  it("is the multisig account for the multisig account itself and its counterparties", () => {
    expect(getTransactionSender(tx, MULTISIG, BigNumber(0))).toBe(MULTISIG);
    expect(getTransactionSender(tx, RECIPIENT, BigNumber(100))).toBe(MULTISIG);
  });

  it("stays the signing owner for that owner, who only pays the gas", () => {
    expect(getTransactionSender(tx, OWNER, BigNumber(0))).toBe(OWNER);
  });

  it("is the multisig account for the signing owner when the owner receives the transfer", () => {
    expect(getTransactionSender(tx, OWNER, BigNumber(100))).toBe(MULTISIG);
  });

  it("is the transaction sender for a non-multisig transaction", () => {
    const plainTx = { ...tx, sender: RECIPIENT, payload: transferPayload } as AptosTransaction;
    expect(getTransactionSender(plainTx, MULTISIG, BigNumber(0))).toBe(RECIPIENT);
  });
});

describe("transactionsToOperations", () => {
  it("lists a multisig APT transfer as sent by the multisig account", () => {
    const [op] = transactionsToOperations(MULTISIG, [
      multisigTransfer(multisigPayload(transferPayload)),
    ]);

    expect(op).toMatchObject({
      type: OP_TYPE.OUT,
      value: BigInt(100),
      senders: [normalizeAddress(MULTISIG)],
      recipients: [normalizeAddress(RECIPIENT)],
    });
  });

  it("lists a multisig APT transfer as received from the multisig account", () => {
    const [op] = transactionsToOperations(RECIPIENT, [
      multisigTransfer(multisigPayload(transferPayload)),
    ]);

    expect(op).toMatchObject({
      type: OP_TYPE.IN,
      value: BigInt(100),
      senders: [normalizeAddress(MULTISIG)],
    });
  });

  it("lists a multisig APT transfer to its signing owner as received from the multisig account", () => {
    const [op] = transactionsToOperations(OWNER, [
      multisigTransfer(multisigPayload({ ...transferPayload, arguments: [OWNER, "100"] }), OWNER),
    ]);

    expect(op).toMatchObject({
      type: OP_TYPE.IN,
      value: BigInt(100),
      senders: [normalizeAddress(MULTISIG)],
    });
  });

  it("skips a user transaction whose payload carries no entry function", () => {
    const scriptTx = multisigTransfer(
      multisigPayload({ type: "script_payload", code: { bytecode: "0x" } }),
    );
    const payloadlessTx = { ...scriptTx, payload: undefined } as unknown as AptosTransaction;

    expect(transactionsToOperations(MULTISIG, [scriptTx, payloadlessTx, null])).toEqual([]);
  });
});
