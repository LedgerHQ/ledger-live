import { TransactionBlockData, SuiTransactionBlockResponse } from "@mysten/sui/client";
import {
  getOperationType,
  getOperationSenders,
  getOperationRecipients,
  getOperationAmount,
  getOperationFee,
  getOperationDate,
  transactionToOperation,
  paymentInfo,
} from "./sdk";

import { BigNumber } from "bignumber.js";

const mockTransaction = {
  digest: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
  transaction: {
    data: {
      messageVersion: "v1" as const,
      transaction: {
        kind: "ProgrammableTransaction" as const,
        inputs: [
          {
            type: "pure" as const,
            valueType: "address",
            value: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
          },
        ],
        transactions: [
          {
            TransferObjects: [["GasCoin"], { Input: 0 }],
          },
        ],
      },
      sender: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
      gasData: {
        payment: [
          {
            objectId: "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e",
            version: "57",
            digest: "2rPEonJQQUXeAmAegn3fVqBjpKrC5NadAZBetb5wJQm6",
          },
        ],
        owner: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
        price: "1000",
        budget: "2988000",
      },
    },
    txSignatures: [
      "AJKFd5y+1y/ggTAKTZlrrQlvSWXoYCSU7ksxyBG6BI9FDjN/R8db5PNbw19Bs+Lp4VE0cu9BBzAc/gYDFwgYrQVgR+QnZSFg3qWm+IjLX2dEep/wlLje2lziXO+HmZApcQ==",
    ],
  },
  effects: {
    messageVersion: "v1" as const,
    status: { status: "success" as const },
    executedEpoch: "18",
    gasUsed: {
      computationCost: "1000000",
      storageCost: "988000",
      storageRebate: "978120",
      nonRefundableStorageFee: "9880",
    },
    modifiedAtVersions: [
      {
        objectId: "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e",
        sequenceNumber: "57",
      },
    ],
    transactionDigest: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
    mutated: [
      {
        owner: {
          AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
        },
        reference: {
          objectId: "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e",
          version: "58",
          digest: "82pvkMbymnBFQjhuDDaaW88BeATbNgWWcWH67DcLaPBi",
        },
      },
    ],
    gasObject: {
      owner: { AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0" },
      reference: {
        objectId: "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e",
        version: "58",
        digest: "82pvkMbymnBFQjhuDDaaW88BeATbNgWWcWH67DcLaPBi",
      },
    },
    dependencies: ["D8tHbu9JwGuoaH67PFXCoswqDUy2M4S6KVLWhCodt1a7"],
  },
  balanceChanges: [
    {
      owner: { AddressOwner: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24" },
      coinType: "0x2::sui::SUI",
      amount: "-10000000000",
    },
    {
      owner: { AddressOwner: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0" },
      coinType: "0x2::sui::SUI",
      amount: "9998990120",
    },
  ],
  timestampMs: "1742294454878",
  checkpoint: "313024",
};

describe("SDK Functions", () => {
  test("getOperationType should return IN for incoming tx", () => {
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    expect(
      getOperationType(address, mockTransaction.transaction?.data as TransactionBlockData),
    ).toBe("IN");
  });

  test("getOperationSenders should return sender address", () => {
    expect(getOperationSenders(mockTransaction.transaction?.data as TransactionBlockData)).toEqual([
      "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
    ]);
  });

  test("getOperationRecipients should return recipient addresses", () => {
    expect(
      getOperationRecipients(mockTransaction.transaction?.data as TransactionBlockData),
    ).toEqual(["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"]);
  });

  test("getOperationAmount should calculate amount correctly", () => {
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    expect(getOperationAmount(address, mockTransaction as SuiTransactionBlockResponse)).toEqual(
      new BigNumber(0),
    );
  });

  test("getOperationFee should calculate fee correctly", () => {
    expect(getOperationFee(mockTransaction as SuiTransactionBlockResponse)).toEqual(
      new BigNumber(1009880),
    );
  });

  test("getOperationDate should return correct date", () => {
    expect(getOperationDate(mockTransaction as SuiTransactionBlockResponse)).toEqual(
      new Date("2025-03-18T10:40:54.878Z"),
    );
  });

  test("transactionToOperation should map transaction to operation", () => {
    const accountId = "mockAccountId";
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    const operation = transactionToOperation(
      accountId,
      address,
      mockTransaction as SuiTransactionBlockResponse,
    );
    expect(operation).toHaveProperty("id");
    expect(operation).toHaveProperty("accountId", accountId);
  });

  test("paymentInfo should return gas budget and fees", async () => {
    const sender = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
    const fakeTransaction = {
      mode: "sent",
      family: "sui" as const,
      amount: new BigNumber(100),
      recipient: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
      errors: {},
    };
    const info = await paymentInfo(sender, fakeTransaction);
    expect(info).toHaveProperty("gasBudget");
    expect(info).toHaveProperty("totalGasUsed");
    expect(info).toHaveProperty("fees");
  });
});
