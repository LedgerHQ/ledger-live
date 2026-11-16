import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAccount, getCurrentBlockHeight, getOperations } from "../../api";
import { getDelegation } from "../../api/node";
import { getAccountShape } from "../../synchronization";

jest.mock("../../api");
jest.mock("../../api/node");

const ADDRESS = "hxe52720d9125586e64c745bf3c2c1917dbb46f9ba";
const ACCOUNT_ID = `js:2:icon:${ADDRESS}:`;

const mockedGetAccount = jest.mocked(getAccount);
const mockedGetCurrentBlockHeight = jest.mocked(getCurrentBlockHeight);
const mockedGetOperations = jest.mocked(getOperations);
const mockedGetDelegation = jest.mocked(getDelegation);

const makeOperation = (id: string, date: string): Operation =>
  ({ id, hash: id, date: new Date(date) }) as unknown as Operation;

const makeInfo = (initialAccount?: unknown): AccountShapeInfo =>
  ({
    address: ADDRESS,
    currency: { id: "icon" },
    derivationMode: "",
    initialAccount,
  }) as unknown as AccountShapeInfo;

describe("getAccountShape", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCurrentBlockHeight.mockResolvedValue(100);
    mockedGetAccount.mockResolvedValue({ balance: 1.5, contract_updated_block: 0 } as never);
    mockedGetDelegation.mockResolvedValue({
      delegations: [],
      totalDelegated: new BigNumber(1e17),
      votingPower: new BigNumber(2e17),
    } as never);
    mockedGetOperations.mockResolvedValue([]);
  });

  it("returns the balance, the spendable balance, the resources and the operations from the indexer and the node", async () => {
    const operation = makeOperation("new", "2021-01-02");
    mockedGetOperations.mockResolvedValue([operation]);

    const shape = await getAccountShape(makeInfo(), {} as never);

    expect(shape).toEqual({
      id: ACCOUNT_ID,
      balance: new BigNumber(1.5e18),
      spendableBalance: new BigNumber(1.2e18),
      operationsCount: 1,
      blockHeight: 100,
      iconResources: {
        nonce: 0,
        totalDelegated: new BigNumber(1e17),
        votingPower: new BigNumber(2e17),
      },
      operations: [operation],
    });
  });

  it("returns an empty zero-balance account shape when the indexer fails", async () => {
    mockedGetAccount.mockRejectedValue(new Error("down"));

    const shape = await getAccountShape(makeInfo(), {} as never);

    expect(shape).toEqual({
      id: ACCOUNT_ID,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      operationsCount: 0,
      iconResources: {
        nonce: 0,
        totalDelegated: new BigNumber(0),
        votingPower: new BigNumber(0),
      },
      blockHeight: 0,
      operations: [],
    });
  });

  it("merges the new operations with the previously synced ones without duplicates", async () => {
    const storedOnly = makeOperation("stored-only", "2020-12-01");
    const overlapping = makeOperation("overlapping", "2021-01-01");
    const fetched = makeOperation("new", "2021-01-02");
    mockedGetOperations.mockResolvedValue([fetched, overlapping]);

    const shape = await getAccountShape(
      makeInfo({ operations: [overlapping, storedOnly] }),
      {} as never,
    );

    expect(shape.operations).toEqual([fetched, overlapping, storedOnly]);
    expect(shape.operationsCount).toEqual(3);
  });

  it("uses zero as the balance when the indexer returns no balance", async () => {
    mockedGetAccount.mockResolvedValue({
      balance: undefined,
      contract_updated_block: 0,
    } as never);

    const shape = await getAccountShape(makeInfo(), {} as never);

    expect(shape.balance).toEqual(new BigNumber(0));
  });
});
