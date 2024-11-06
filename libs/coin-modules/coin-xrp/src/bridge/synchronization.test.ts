import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { Account, SyncConfig } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAccountShape } from "./synchronization";

const mockGetServerInfos = jest.fn().mockResolvedValue({
  info: {
    complete_ledgers: "1-2",
    validated_ledger: {
      reserve_base_xrp: "0",
      reserve_inc_xrp: "0",
    },
  },
});
const mockGetAccountInfo = jest.fn().mockResolvedValue({
  isNewAccount: true,
  balance: "0",
  ownerCount: 0,
  sequence: 0,
});
const mockGetTransactions = jest.fn();
jest.mock("../network", () => ({
  getServerInfos: () => mockGetServerInfos(),
  getAccountInfo: () => mockGetAccountInfo(),
  getTransactions: () => mockGetTransactions(),
}));

describe("getAccountShape", () => {
  beforeEach(() => {
    mockGetServerInfos.mockClear();
    mockGetAccountInfo.mockClear();
    mockGetTransactions.mockClear();
  });

  it("returns early when account is new", async () => {
    // Given
    mockGetAccountInfo.mockResolvedValue({
      isNewAccount: true,
      balance: "0",
      ownerCount: 0,
      sequence: 0,
    });

    // When
    const account = await getAccountShape(
      {
        address: "address",
        currency: getCryptoCurrencyById("ripple"),
        derivationMode: "",
        index: 0,
      } as AccountShapeInfo<Account>,
      {} as SyncConfig,
    );

    // Then
    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(mockGetServerInfos).toHaveBeenCalledTimes(0);
    expect(mockGetTransactions).toHaveBeenCalledTimes(0);
    expect(account).toEqual({
      id: "js:2:ripple:address:",
      xpub: "address",
      blockHeight: 0,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      operations: [],
      operationsCount: 0,
    });
  });

  it("convert correctly operations", async () => {
    // Given
    mockGetAccountInfo.mockResolvedValue({
      isNewAccount: false,
      balance: "0",
      ownerCount: 0,
      sequence: 0,
    });
    mockGetTransactions.mockResolvedValue([
      {
        meta: { delivered_amount: "100" },
        tx: {
          TransactionType: "Payment",
          Fee: "10",
          hash: "HASH_VALUE",
          inLedger: 1,
          date: 1000,
          Account: "account_addr",
          Destination: "destination_addr",
          Sequence: 1,
        },
      },
    ]);

    // When
    const account = await getAccountShape(
      {
        address: "address",
        currency: getCryptoCurrencyById("ripple"),
        derivationMode: "",
        index: 0,
      } as AccountShapeInfo<Account>,
      {} as SyncConfig,
    );

    // Then
    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(mockGetServerInfos).toHaveBeenCalled();
    expect(mockGetTransactions).toHaveBeenCalledTimes(1);
    expect(account).toEqual({
      id: "js:2:ripple:address:",
      xpub: "address",
      blockHeight: 2,
      operationsCount: 1,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      operations: [
        {
          accountId: "js:2:ripple:address:",
          blockHash: null,
          blockHeight: 1,
          date: new Date("2000-01-01T00:16:40.000Z"),
          hash: "HASH_VALUE",
          id: "js:2:ripple:address:-HASH_VALUE-IN",
          recipients: ["destination_addr"],
          senders: ["account_addr"],
          transactionSequenceNumber: 1,
          type: "IN",
          value: new BigNumber("100"),
          fee: new BigNumber("10"),
          extra: {},
        },
      ],
    });
  });
});
