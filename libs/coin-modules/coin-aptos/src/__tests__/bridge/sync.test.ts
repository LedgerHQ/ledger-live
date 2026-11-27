import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { decodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom, reduce } from "rxjs";
import { createBridges } from "../../bridge";
import { createFixtureAccount } from "../../bridge/bridge.fixture";
import { txsToOps } from "../../bridge/logic";
import { AptosAPI } from "../../network";
import { AptosAccount } from "../../types";

jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account/index"),
  decodeTokenAccountId: jest.fn(),
}));
jest.mock("../../network", () => ({
  ...jest.requireActual("../../network"),
  AptosAPI: jest.fn(),
}));
jest.mock("../../bridge/logic", () => ({
  ...jest.requireActual("../../bridge/logic"),
  txsToOps: jest.fn(),
}));

const currency = getCryptoCurrencyById("aptos");
const accountId = "js:2:aptos:474d:aptos";
const tokenAccountId = `${accountId}+aptos%2Fcoin%2Fdstapt`;
const token = {
  type: "TokenCurrency",
  id: "aptos/coin/dstapt_0xd111::staked_coin::stakedaptos",
  contractAddress: "0xd111::staked_coin::StakedAptos",
  parentCurrencyId: "aptos",
  name: "dstAPT",
  tokenType: "coin",
  ticker: "dstAPT",
  disableCountervalue: false,
  delisted: false,
  units: [{ name: "dstAPT", code: "dstAPT", magnitude: 8 }],
} as unknown as TokenCurrency;

const coinOperation = {
  id: `${accountId}-0xabc-OUT`,
  hash: "0xabc",
  type: "OUT",
  value: BigNumber(1000),
  fee: BigNumber(12),
  blockHash: "0xblock",
  blockHeight: 311942427,
  senders: ["0xa0d8"],
  recipients: ["0x4e5e"],
  accountId,
  date: new Date("2025-03-28T15:56:00.481Z"),
  extra: {},
} as Operation;
const tokenOperation = {
  ...coinOperation,
  id: `${tokenAccountId}-0xabc-OUT`,
  accountId: tokenAccountId,
} as Operation;

describe("Aptos account bridge sync", () => {
  beforeEach(() => {
    jest.mocked(AptosAPI).mockImplementation(
      () =>
        ({
          getAccountInfo: jest.fn().mockResolvedValue({
            balance: BigNumber(1),
            transactions: [],
            blockHeight: 311942427,
          }),
          getBalances: jest
            .fn()
            .mockResolvedValue([{ contractAddress: token.contractAddress, amount: BigNumber(5) }]),
        }) as unknown as AptosAPI,
    );
    jest.mocked(decodeTokenAccountId).mockResolvedValue({ token, accountId });
    jest
      .mocked(txsToOps)
      .mockResolvedValue([[{ ...coinOperation, subOperations: [] }], [tokenOperation], []]);
  });

  it("stores the sub operations inferred for an operation it already held", async () => {
    const storedAccount = createFixtureAccount({
      id: accountId,
      xpub: "474d",
      derivationMode: "aptos",
      freshAddress: "0xa0d8",
      freshAddressPath: "44'/637'/0'/0'/0'",
      currency,
      operations: [Object.freeze({ ...coinOperation, subOperations: [] })],
      operationsCount: 1,
    });
    const { accountBridge } = createBridges(jest.fn());

    const synced = await lastValueFrom(
      accountBridge
        .sync(storedAccount, { paginationConfig: {} })
        .pipe(reduce((account: AptosAccount, updater) => updater(account), storedAccount)),
    );

    expect(synced.operations).toHaveLength(1);
    expect(synced.operations[0].subOperations).toEqual([tokenOperation]);
  });
});
