/* eslint-disable no-irregular-whitespace */
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { Account } from "@ledgerhq/types-live";
import { Address, Cell } from "@ton/core";
import BigNumber from "bignumber.js";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";
import type { Transaction, TransactionRaw } from "./types";

const baseTx: Transaction = {
  family: "ton",
  amount: BigNumber(0),
  fees: BigNumber(0),
  recipient: "recipient",
  comment: { isEncrypted: false, text: "" },
};

const baseRawTx: TransactionRaw = {
  family: "ton",
  amount: "0",
  fees: "0",
  recipient: "recipient",
  comment: { isEncrypted: false, text: "" },
};

const rawRandomAddress = "0:ed1691307050047117b998b561d8de82d31fbf84910ced6eb5fc92e7485ef8a7";
const randomAddress = Address.parse(rawRandomAddress);

const emptyCell = Cell.EMPTY;
const rawEmptyCell = emptyCell.toBoc().toString("base64");

const cases: Array<{
  name: string;
  tx: Transaction;
  rawTx: TransactionRaw;
}> = [
  {
    name: "normal tx",
    tx: {
      ...baseTx,
    },
    rawTx: {
      ...baseRawTx,
    },
  },
  {
    name: "tx with comment",
    tx: {
      ...baseTx,
      comment: {
        isEncrypted: false,
        text: "hello",
      },
    },
    rawTx: {
      ...baseRawTx,
      comment: {
        isEncrypted: false,
        text: "hello",
      },
    },
  },
  {
    name: "tx with payload for jetton-transfer",
    tx: {
      ...baseTx,
      payload: {
        type: "jetton-transfer",
        queryId: BigInt(0),
        amount: BigInt(0),
        destination: randomAddress,
        responseDestination: randomAddress,
        customPayload: emptyCell,
        forwardAmount: BigInt(0),
        forwardPayload: emptyCell,
        knownJetton: {
          jettonId: 0,
          workchain: 0,
        },
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "jetton-transfer",
        queryId: "0",
        amount: "0",
        destination: rawRandomAddress,
        responseDestination: rawRandomAddress,
        customPayload: rawEmptyCell,
        forwardAmount: "0",
        forwardPayload: rawEmptyCell,
        knownJetton: {
          jettonId: 0,
          workchain: 0,
        },
      },
    },
  },
  {
    name: "tx with payload for jetton-transfer and no customPayload",
    tx: {
      ...baseTx,
      payload: {
        type: "jetton-transfer",
        queryId: BigInt(0),
        amount: BigInt(0),
        destination: randomAddress,
        responseDestination: randomAddress,
        customPayload: null,
        forwardAmount: BigInt(0),
        forwardPayload: emptyCell,
        knownJetton: {
          jettonId: 0,
          workchain: 0,
        },
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "jetton-transfer",
        queryId: "0",
        amount: "0",
        destination: rawRandomAddress,
        responseDestination: rawRandomAddress,
        customPayload: null,
        forwardAmount: "0",
        forwardPayload: rawEmptyCell,
        knownJetton: {
          jettonId: 0,
          workchain: 0,
        },
      },
    },
  },
  {
    name: "tx with payload for nft-transfer",
    tx: {
      ...baseTx,
      payload: {
        type: "nft-transfer",
        queryId: BigInt(0),
        newOwner: randomAddress,
        responseDestination: randomAddress,
        customPayload: emptyCell,
        forwardAmount: BigInt(0),
        forwardPayload: emptyCell,
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "nft-transfer",
        queryId: "0",
        newOwner: rawRandomAddress,
        responseDestination: rawRandomAddress,
        customPayload: rawEmptyCell,
        forwardAmount: "0",
        forwardPayload: rawEmptyCell,
      },
    },
  },
  {
    name: "tx with payload for nft-transfer and no queryId",
    tx: {
      ...baseTx,
      payload: {
        type: "nft-transfer",
        queryId: null,
        newOwner: randomAddress,
        responseDestination: randomAddress,
        customPayload: emptyCell,
        forwardAmount: BigInt(0),
        forwardPayload: emptyCell,
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "nft-transfer",
        queryId: null,
        newOwner: rawRandomAddress,
        responseDestination: rawRandomAddress,
        customPayload: rawEmptyCell,
        forwardAmount: "0",
        forwardPayload: rawEmptyCell,
      },
    },
  },
  {
    name: "tx with payload for comment",
    tx: {
      ...baseTx,
      payload: {
        type: "comment",
        text: "test",
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "comment",
        text: "test",
      },
    },
  },
  {
    name: "tx with payload for comment",
    tx: {
      ...baseTx,
      payload: {
        type: "comment",
        text: "test",
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "comment",
        text: "test",
      },
    },
  },
  {
    name: "tx with payload for unsafe",
    tx: {
      ...baseTx,
      payload: {
        type: "unsafe",
        message: emptyCell,
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "unsafe",
        message: rawEmptyCell,
      },
    },
  },
  {
    name: "tx with payload for jetton-burn",
    tx: {
      ...baseTx,
      payload: {
        type: "jetton-burn",
        queryId: BigInt(0),
        amount: BigInt(0),
        responseDestination: randomAddress,
        customPayload: emptyCell,
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "jetton-burn",
        queryId: "0",
        amount: "0",
        responseDestination: rawRandomAddress,
        customPayload: rawEmptyCell,
      },
    },
  },
  {
    name: "tx with payload for jetton-burn with buffer",
    tx: {
      ...baseTx,
      payload: {
        type: "jetton-burn",
        queryId: BigInt(0),
        amount: BigInt(0),
        responseDestination: randomAddress,
        customPayload: Buffer.from("test"),
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "jetton-burn",
        queryId: "0",
        amount: "0",
        responseDestination: rawRandomAddress,
        customPayload: "74657374",
      },
    },
  },
  {
    name: "tx with payload for jetton-burn and no customPayload",
    tx: {
      ...baseTx,
      payload: {
        type: "jetton-burn",
        queryId: BigInt(0),
        amount: BigInt(0),
        responseDestination: randomAddress,
        customPayload: null,
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "jetton-burn",
        queryId: "0",
        amount: "0",
        responseDestination: rawRandomAddress,
        customPayload: null,
      },
    },
  },
  {
    name: "tx with payload for add-whitelist",
    tx: {
      ...baseTx,
      payload: {
        type: "add-whitelist",
        queryId: BigInt(0),
        address: randomAddress,
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "add-whitelist",
        queryId: "0",
        address: rawRandomAddress,
      },
    },
  },
  {
    name: "tx with payload for single-nominator-withdraw",
    tx: {
      ...baseTx,
      payload: {
        type: "single-nominator-withdraw",
        queryId: BigInt(0),
        amount: BigInt(0),
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "single-nominator-withdraw",
        queryId: "0",
        amount: "0",
      },
    },
  },
  {
    name: "tx with payload for single-nominator-change-validator",
    tx: {
      ...baseTx,
      payload: {
        type: "single-nominator-change-validator",
        queryId: BigInt(0),
        address: randomAddress,
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "single-nominator-change-validator",
        queryId: "0",
        address: rawRandomAddress,
      },
    },
  },
  {
    name: "tx with payload for tonstakers-deposit",
    tx: {
      ...baseTx,
      payload: {
        type: "tonstakers-deposit",
        queryId: BigInt(0),
        appId: BigInt(0),
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "tonstakers-deposit",
        queryId: "0",
        appId: "0",
      },
    },
  },
  {
    name: "tx with payload for vote-for-proposal",
    tx: {
      ...baseTx,
      payload: {
        type: "vote-for-proposal",
        queryId: BigInt(0),
        votingAddress: randomAddress,
        expirationDate: 0,
        vote: true,
        needConfirmation: true,
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "vote-for-proposal",
        queryId: "0",
        votingAddress: rawRandomAddress,
        expirationDate: 0,
        vote: true,
        needConfirmation: true,
      },
    },
  },
  {
    name: "tx with payload for change-dns-record type wallet",
    tx: {
      ...baseTx,
      payload: {
        type: "change-dns-record",
        queryId: BigInt(0),
        record: {
          type: "wallet",
          value: {
            address: randomAddress,
            capabilities: {
              isWallet: true,
            },
          },
        },
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "change-dns-record",
        queryId: "0",
        record: {
          type: "wallet",
          value: {
            address: rawRandomAddress,
            capabilities: {
              isWallet: true,
            },
          },
        },
      },
    },
  },
  {
    name: "tx with payload for change-dns-record type wallet no value",
    tx: {
      ...baseTx,
      payload: {
        type: "change-dns-record",
        queryId: BigInt(0),
        record: {
          type: "wallet",
          value: null,
        },
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "change-dns-record",
        queryId: "0",
        record: {
          type: "wallet",
          value: null,
        },
      },
    },
  },
  {
    name: "tx with payload for change-dns-record type unknown",
    tx: {
      ...baseTx,
      payload: {
        type: "change-dns-record",
        queryId: BigInt(0),
        record: {
          type: "unknown",
          key: Buffer.from("testKey"),
          value: emptyCell,
        },
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "change-dns-record",
        queryId: "0",
        record: {
          type: "unknown",
          key: "746573744b6579",
          value: rawEmptyCell,
        },
      },
    },
  },
  {
    name: "tx with payload for token-bridge-pay-swap",
    tx: {
      ...baseTx,
      payload: {
        type: "token-bridge-pay-swap",
        queryId: BigInt(0),
        swapId: Buffer.from("swapId"),
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "token-bridge-pay-swap",
        queryId: "0",
        swapId: "737761704964",
      },
    },
  },
  {
    name: "tx with payload for tonwhales-pool-deposit",
    tx: {
      ...baseTx,
      payload: {
        type: "tonwhales-pool-deposit",
        queryId: BigInt(1),
        gasLimit: BigInt(1000),
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "tonwhales-pool-deposit",
        queryId: "1",
        gasLimit: "1000",
      },
    },
  },
  {
    name: "tx with payload for tonwhales-pool-withdraw",
    tx: {
      ...baseTx,
      payload: {
        type: "tonwhales-pool-withdraw",
        queryId: BigInt(2),
        gasLimit: BigInt(2000),
        amount: BigInt(3000),
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "tonwhales-pool-withdraw",
        queryId: "2",
        gasLimit: "2000",
        amount: "3000",
      },
    },
  },
  {
    name: "tx with payload for vesting-send-msg-comment",
    tx: {
      ...baseTx,
      payload: {
        type: "vesting-send-msg-comment",
        queryId: BigInt(3),
        sendMode: 0,
        value: BigInt(4000),
        destination: randomAddress,
        text: "vesting comment",
      },
    },
    rawTx: {
      ...baseRawTx,
      payload: {
        type: "vesting-send-msg-comment",
        queryId: "3",
        sendMode: 0,
        value: "4000",
        destination: rawRandomAddress,
        text: "vesting comment",
      },
    },
  },
  // Intentionally testing an unsupported payload type.
  {
    name: "tx with payload we don't support",
    // Cast via unknown to avoid direct any assertions
    tx: {
      ...baseTx,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      payload: { type: "fake-type", as: "is" } as unknown as Transaction["payload"],
    },
    rawTx: {
      ...baseRawTx,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      payload: { type: "fake-type", as: "is" } as unknown as TransactionRaw["payload"],
    },
  },
];

describe("toTransactionRaw", () => {
  it.each(cases)("should work for $name", ({ tx, rawTx }) => {
    const resTx = toTransactionRaw(tx);

    expect(resTx).toEqual(rawTx);
  });
});

describe("fromTransactionRaw", () => {
  it.each(cases)("should work for $name", ({ tx, rawTx }) => {
    const resTx = fromTransactionRaw(rawTx);

    expect(resTx).toEqual(tx);
  });
});

const TON = getCryptoCurrencyById("ton");

describe("formatTransaction", () => {
  const account: Account = genAccount("mocked-ton-account-1", {
    currency: TON,
  });

  it("transaction with 0 amount", () => {
    const transaction: Transaction = {
      family: "ton",
      amount: BigNumber(0),
      recipient: "test-recipient",
      fees: BigNumber(0),
      comment: {
        isEncrypted: false,
        text: "",
      },
    };
    expect(formatTransaction(transaction, account)).toMatchInlineSnapshot(`
"
SEND 
TO test-recipient"
`);
  });

  it("transaction with amount", () => {
    const transaction: Transaction = {
      family: "ton",
      amount: BigNumber(1000),
      recipient: "test-recipient",
      fees: BigNumber(0),
      comment: {
        isEncrypted: false,
        text: "",
      },
    };
    expect(formatTransaction(transaction, account)).toMatchInlineSnapshot(`
"
SEND  0.000001 TON
TO test-recipient"
`);
  });

  it("transaction with useAllAmount", () => {
    const transaction: Transaction = {
      family: "ton",
      amount: BigNumber(1000),
      recipient: "test-recipient",
      fees: BigNumber(0),
      comment: {
        isEncrypted: false,
        text: "",
      },
      useAllAmount: true,
    };
    expect(formatTransaction(transaction, account)).toMatchInlineSnapshot(`
"
SEND MAX
TO test-recipient"
`);
  });
});
