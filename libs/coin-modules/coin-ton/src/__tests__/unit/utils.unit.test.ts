import { Address, toNano } from "@ton/core";
import { TOKEN_TRANSFER_MAX_FEE } from "../../constants";
import { TonComment, TonPayloadFormat, TonPayloadJettonTransfer } from "../../types";
import {
  addressesAreEqual,
  buildTonTransaction,
  commentIsValid,
  getLedgerTonPath,
  getTransferExpirationTime,
  isAddressValid,
  isJettonTransfer,
} from "../../utils";
import {
  account,
  transaction as baseTransaction,
  jettonTransaction,
} from "../fixtures/common.fixtures";

describe("TON addresses", () => {
  const addr = {
    raw: "0:074c7194d64e8218f2cfaab8e79b34201adbed0f8fa7f2773e604dd39969b5ff",
    rawWrong: "0:074c7194d64e8218f2cfaab8e79b34201adbed0f8fa7f2773e604dd39969b5f",
    bounceUrl: "EQAHTHGU1k6CGPLPqrjnmzQgGtvtD4-n8nc-YE3TmWm1_1JZ",
    bounceNoUrl: "EQAHTHGU1k6CGPLPqrjnmzQgGtvtD4+n8nc+YE3TmWm1/1JZ",
    bounceWrong: "EQAHTHGU1k6CGPLPqrjnmzQgGtvtD4+n8nc+YE3TmWm1/1J",
    noBounceUrl: "UQAHTHGU1k6CGPLPqrjnmzQgGtvtD4-n8nc-YE3TmWm1_w-c",
    noBounceNoUrl: "UQAHTHGU1k6CGPLPqrjnmzQgGtvtD4+n8nc+YE3TmWm1/w+c",
    noBounceWrong: "UQAHTHGU1k6CGPLPqrjnmzQgGtvtD4+n8nc+YE3TmWm1/w+",
    diff: "UQBjrXgZbYDCpxLKpgMnBe985kYDfUeriuYUafbuKgdBpWuJ",
  };
  test("Check if addresses are valid", () => {
    expect(isAddressValid(addr.raw)).toBe(true);
    expect(isAddressValid(addr.bounceUrl)).toBe(true);
    expect(isAddressValid(addr.bounceNoUrl)).toBe(true);
    expect(isAddressValid(addr.noBounceUrl)).toBe(true);
    expect(isAddressValid(addr.noBounceNoUrl)).toBe(true);
    expect(isAddressValid(addr.rawWrong)).toBe(false);
    expect(isAddressValid(addr.bounceWrong)).toBe(false);
    expect(isAddressValid(addr.noBounceWrong)).toBe(false);
    expect(isAddressValid(addr.diff)).toBe(true);
  });
  test("Compare addresses", () => {
    expect(addressesAreEqual(addr.raw, addr.bounceUrl)).toBe(true);
    expect(addressesAreEqual(addr.raw, addr.noBounceUrl)).toBe(true);
    expect(addressesAreEqual(addr.bounceUrl, addr.noBounceUrl)).toBe(true);
    expect(addressesAreEqual(addr.rawWrong, addr.noBounceUrl)).toBe(false);
    expect(addressesAreEqual(addr.noBounceNoUrl, addr.diff)).toBe(false);
  });
});

test("TON Comments are valid", () => {
  const msg = (e: boolean, m: string): TonComment => ({ isEncrypted: e, text: m });
  expect(commentIsValid(msg(false, ""))).toBe(true);
  expect(commentIsValid(msg(false, "Hello world!"))).toBe(true);
  expect(
    commentIsValid(
      msg(
        false,
        " 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789", // 120 chars
      ),
    ),
  ).toBe(true);
  expect(
    commentIsValid(
      msg(
        false,
        " 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 ", // 121 chars
      ),
    ),
  ).toBe(false);
  expect(commentIsValid(msg(false, "😀"))).toBe(false);
  expect(commentIsValid(msg(true, ""))).toBe(false);
});

describe("TON transfers", () => {
  const commentPayload: TonPayloadFormat = {
    type: "comment",
    text: "",
  };

  const transferPayload: TonPayloadFormat = {
    type: "jetton-transfer",
    queryId: null,
    amount: BigInt(0),
    destination: new Address(0, Buffer.alloc(32)),
    responseDestination: new Address(0, Buffer.alloc(32)),
    customPayload: null,
    forwardAmount: BigInt(0),
    forwardPayload: null,
  };

  const nftPayload: TonPayloadFormat = {
    type: "nft-transfer",
    queryId: null,
    newOwner: new Address(0, Buffer.alloc(32)),
    responseDestination: new Address(0, Buffer.alloc(32)),
    customPayload: null,
    forwardAmount: BigInt(0),
    forwardPayload: null,
  };

  test("Check if the transaction is jetton transfer", () => {
    expect(isJettonTransfer(commentPayload)).toBe(false);
    expect(isJettonTransfer(transferPayload)).toBe(true);
    expect(isJettonTransfer(nftPayload)).toBe(false);
  });
});

describe("Get TON paths", () => {
  const correctPath = ["44'/607'/0'/0'/0'/0'", "m/44'/607'/0'/0'/0'/0'"];
  const wrongPaths = [
    "44'/607'/0'/0'/0'",
    "44'/607'/0'/0/'/0'",
    "44'/607'/0'/0'/x'/0'",
    "44'/607'/0'/-3'/0'/0'",
    "44'/607'/0'/2147483650'/0'/0'",
  ];

  test("Correct paths return a correct response", () => {
    correctPath.map((path: string) => {
      expect(getLedgerTonPath(path)).toStrictEqual([44, 607, 0, 0, 0, 0]);
    });
  });

  test("Wrong paths fail", () => {
    wrongPaths.map((path: string) => {
      expect(() => getLedgerTonPath(path)).toThrow(/^(\[ton\] Path)/);
    });
  });
});

describe("Build TON transaction", () => {
  const seqno = 22;

  test("Build TON transaction with an specific amount", () => {
    const tonTransaction = buildTonTransaction(baseTransaction, seqno, account);

    // Convert the Address to string to compare
    expect({ ...tonTransaction, to: tonTransaction.to.toString() }).toEqual({
      to: Address.parse(baseTransaction.recipient).toString(),
      seqno,
      amount: BigInt(baseTransaction.amount.toString()),
      bounce: false,
      timeout: getTransferExpirationTime(),
      sendMode: 3,
    });
  });

  test("Build TON transaction when useAllAmount is true and there is a comment", () => {
    const transaction = { ...baseTransaction };
    transaction.useAllAmount = true;
    transaction.comment.text = "valid coment";
    const tonTransaction = buildTonTransaction(transaction, seqno, account);

    // Convert the Address to string to compare
    expect({ ...tonTransaction, to: tonTransaction.to.toString() }).toEqual({
      to: Address.parse(transaction.recipient).toString(),
      seqno,
      amount: BigInt(0),
      bounce: false,
      timeout: getTransferExpirationTime(),
      sendMode: 128,
      payload: { type: "comment", text: transaction.comment.text },
    });
  });

  test("Build jetton transaction with an specific amount", () => {
    const jettonTransfer = buildTonTransaction(jettonTransaction, seqno, account);

    // Convert the Addresses to string to compare
    expect({
      ...jettonTransfer,
      to: jettonTransfer.to.toString(),
      payload: undefined,
    }).toStrictEqual({
      to: Address.parse(account.subAccounts?.[0].token.contractAddress ?? "").toString(),
      seqno,
      amount: toNano(TOKEN_TRANSFER_MAX_FEE),
      bounce: true,
      timeout: getTransferExpirationTime(),
      sendMode: 3,
      payload: undefined,
    });

    expect(jettonTransfer.payload?.type).toStrictEqual("jetton-transfer");

    expect({
      ...jettonTransfer.payload,
      destination: (jettonTransfer.payload as TonPayloadJettonTransfer).destination.toString(),
      responseDestination: (
        jettonTransfer.payload as TonPayloadJettonTransfer
      ).responseDestination.toString(),
    }).toStrictEqual({
      type: "jetton-transfer",
      queryId: BigInt(1),
      amount: BigInt(jettonTransaction.amount.toFixed()),
      destination: Address.parse(jettonTransaction.recipient).toString(),
      responseDestination: Address.parse(account.freshAddress).toString(),
      customPayload: null,
      forwardAmount: BigInt(1),
      forwardPayload: null,
    });
  });
});
