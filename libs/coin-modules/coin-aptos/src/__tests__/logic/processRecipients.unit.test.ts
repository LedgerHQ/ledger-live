import { InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { APTOS_ASSET_ID } from "../../constants";
import { processRecipients } from "../../logic/processRecipients";

describe("processRecipients", () => {
  let op: Operation;

  beforeEach(() => {
    op = {
      id: "",
      hash: "",
      type: "" as OperationType,
      value: new BigNumber(0),
      fee: new BigNumber(0),
      blockHash: "",
      blockHeight: 0,
      senders: [],
      recipients: [],
      accountId: "",
      date: new Date(),
      extra: {},
      transactionSequenceNumber: new BigNumber(0),
      hasFailed: false,
    };
  });

  it("should add recipient for transfer-like functions from LL account", () => {
    const payload: InputEntryFunctionData = {
      function: "0x1::coin::transfer",
      typeArguments: [],
      functionArguments: ["0x13", 1], // from: &signer, to: address, amount: u64
    };

    processRecipients(payload, "0x13", op, "0x1");
    expect(op.recipients).toContain(
      "0x0000000000000000000000000000000000000000000000000000000000000013",
    );
  });

  it("should add recipient for transfer-like functions from external account", () => {
    const payload: InputEntryFunctionData = {
      function: "0x1::coin::transfer",
      typeArguments: [],
      functionArguments: ["0x12", 1], // from: &signer, to: address, amount: u64
    };

    processRecipients(payload, "0x13", op, "0x1");
    expect(op.recipients).toContain(
      "0x0000000000000000000000000000000000000000000000000000000000000012",
    );
  });

  it("should add recipients for batch transfer functions", () => {
    const payload: InputEntryFunctionData = {
      function: "0x1::aptos_account::batch_transfer_coins",
      typeArguments: [APTOS_ASSET_ID],
      functionArguments: [
        ["0x12", "0x13"],
        [1, 2],
      ],
    };

    op.senders.push("0x11");
    processRecipients(payload, "0x12", op, "0x1");
    expect(op.recipients).toContain(
      "0x0000000000000000000000000000000000000000000000000000000000000012",
    );
  });

  it("should add function address as recipient for other smart contracts", () => {
    const payload: InputEntryFunctionData = {
      function: "0x2::other::contract",
      typeArguments: [],
      functionArguments: [["0x12"], [1]],
    };

    processRecipients(payload, "0x11", op, "0x2");
    expect(op.recipients).toContain("0x2");
  });

  it("should add recipient for fungible assets transfer-like functions", () => {
    const payload: InputEntryFunctionData = {
      function: "0x1::primary_fungible_store::transfer",
      typeArguments: [],
      functionArguments: [["0xfff"], "0x13"],
    };

    processRecipients(payload, "0x13", op, "0x1");
    expect(op.recipients).toContain(
      "0x0000000000000000000000000000000000000000000000000000000000000013",
    );
  });
});
