jest.mock("../logic", () => ({
  parseExtendedPublicKey: jest.fn(),
  scanAddresses: jest.fn(),
  scanOperations: jest.fn(),
}));
jest.mock("../network", () => ({
  getBlockDagInfo: jest.fn(),
  getVirtualChainBlueScore: jest.fn(),
}));

import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import BigNumber from "bignumber.js";
import { parseExtendedPublicKey, scanAddresses, scanOperations } from "../logic";
import { getBlockDagInfo, getVirtualChainBlueScore } from "../network";
import type { AccountAddress, AccountAddresses, KaspaAccount } from "../types";
import { getAccountShape } from "./synchronization";

const mockedParseExtendedPublicKey = jest.mocked(parseExtendedPublicKey);
const mockedScanAddresses = jest.mocked(scanAddresses);
const mockedScanOperations = jest.mocked(scanOperations);
const mockedGetBlockDagInfo = jest.mocked(getBlockDagInfo);
const mockedGetVirtualChainBlueScore = jest.mocked(getVirtualChainBlueScore);

const xpub = "02".repeat(65);
const accountId = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: "kaspa",
  xpubOrAddress: xpub,
  derivationMode: "",
});
const address = (
  value: string,
  type: number,
  index: number,
  balance = 0,
  timestamp: number | null = null,
): AccountAddress => ({
  address: value,
  type,
  index,
  balance: new BigNumber(balance),
  active: balance > 0,
  timestamp,
});
const accountAddresses: AccountAddresses = {
  usedReceiveAddresses: [
    address("receive-used", 0, 0, 10, 50_000),
    address("receive-old", 0, 1, 0, 1),
  ],
  usedChangeAddresses: [address("change-used", 1, 0, 5, 60_000)],
  nextReceiveAddress: address("receive-next", 0, 2),
  nextChangeAddress: address("change-next", 1, 1),
  totalBalance: new BigNumber(15),
  spendableBalance: new BigNumber(15),
};

describe("getAccountShape", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedParseExtendedPublicKey.mockReturnValue({
      compressedPublicKey: Buffer.from("key"),
      chainCode: Buffer.from("chain"),
    });
    mockedScanAddresses.mockResolvedValue(accountAddresses);
    mockedScanOperations.mockResolvedValue([]);
    mockedGetBlockDagInfo.mockResolvedValue({ pastMedianTime: "123456" } as Awaited<
      ReturnType<typeof getBlockDagInfo>
    >);
    mockedGetVirtualChainBlueScore.mockResolvedValue(42);
  });

  it("should build an account shape from scanned addresses and operations", async () => {
    const shape = await getAccountShape({ index: 3, rest: { publicKey: xpub } } as Parameters<
      typeof getAccountShape
    >[0]);

    expect(mockedScanOperations).toHaveBeenCalledWith(
      ["receive-used", "change-used"],
      accountId,
      1,
    );
    expect(shape).toMatchObject({
      id: accountId,
      xpub,
      index: 3,
      balance: new BigNumber(15),
      spendableBalance: new BigNumber(15),
      blockHeight: 42,
      lastSyncTimestamp: 123456,
      activeAddressCount: 2,
      freshAddress: "receive-next",
      freshAddressPath: "44'/111111'/3'/0/2",
      used: false,
    });
  });

  it("should rescan from two hours before the previous synchronization and merge operations", async () => {
    const previousOperation = {
      id: "previous",
      date: new Date("2024-01-01"),
    } as KaspaAccount["operations"][number];
    const scannedOperation = {
      id: "scanned",
      date: new Date("2024-01-02"),
    } as KaspaAccount["operations"][number];
    mockedScanAddresses.mockResolvedValue({
      ...accountAddresses,
      usedReceiveAddresses: [address("receive-recent", 0, 0, 10, 900_000)],
      usedChangeAddresses: [address("change-old", 1, 0, 5, 1)],
    });
    mockedScanOperations.mockResolvedValue([scannedOperation]);

    const shape = await getAccountShape({
      index: 0,
      initialAccount: {
        id: accountId,
        xpub,
        lastSyncTimestamp: 8_000_000,
        operations: [previousOperation],
      },
    } as Parameters<typeof getAccountShape>[0]);

    expect(mockedScanOperations).toHaveBeenCalledWith(["receive-recent"], accountId, 800_000);
    expect(shape.operations).toEqual([scannedOperation, previousOperation]);
    expect(shape.operationsCount).toBe(2);
    expect(shape.used).toBe(true);
  });
});
