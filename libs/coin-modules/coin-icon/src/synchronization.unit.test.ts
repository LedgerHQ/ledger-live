import type { Operation } from "@ledgerhq/coin-module-framework/api/index";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import BigNumber from "bignumber.js";
import { getAccount, getCurrentBlockHeight } from "./network/indexer";
import type { AccountType } from "./network/types";
import { getDelegation } from "./api/node";
import { listOperations } from "./logic/listOperations";
import { getAccountShape } from "./synchronization";
import type { IconAccount, IconOperation } from "./types";

jest.mock("./network/indexer");
jest.mock("./api/node");
jest.mock("./logic/listOperations");

const address = "hx123";
const currency = { id: "icon" };
const accountId = "js:2:icon:hx123:";
const syncConfig = { paginationConfig: {}, blacklistedTokenIds: [] };

const buildInfo = (initialAccount?: Partial<IconAccount>) =>
  ({
    address,
    currency,
    derivationMode: "",
    initialAccount,
  }) as unknown as AccountShapeInfo<IconAccount>;

const date = new Date(1609459200000);

const buildCoreOperation = (overrides: Partial<Operation> = {}): Operation => ({
  id: "0xhash",
  type: "OUT",
  senders: [address],
  recipients: ["hx456"],
  value: 1000n,
  asset: { type: "native" },
  details: { hasValue: true },
  tx: {
    hash: "0xhash",
    block: { height: 12345, hash: "", time: date },
    fees: 10n,
    date,
    failed: false,
  },
  ...overrides,
});

describe("getAccountShape", () => {
  const listOperationsMock = jest.mocked(listOperations);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getCurrentBlockHeight).mockResolvedValue(500);
    jest
      .mocked(getAccount)
      .mockResolvedValue({ balance: 2, contract_updated_block: 1000 } as AccountType);
    jest.mocked(getDelegation).mockResolvedValue({
      delegations: [],
      totalDelegated: new BigNumber("100"),
      votingPower: new BigNumber("200"),
    });
    listOperationsMock.mockResolvedValue({ items: [], next: undefined });
  });

  it("returns the account shape with balances, block height and resources", async () => {
    const shape = await getAccountShape(buildInfo(), syncConfig);

    expect(shape).toEqual({
      id: accountId,
      balance: new BigNumber("2000000000000000000"),
      spendableBalance: new BigNumber("1999999999999999700"),
      operationsCount: 0,
      blockHeight: 500,
      iconResources: {
        nonce: 0,
        totalDelegated: new BigNumber("100"),
        votingPower: new BigNumber("200"),
      },
      operations: [],
    });
  });

  it("uses a zero balance when the account has none", async () => {
    jest.mocked(getAccount).mockResolvedValue({ contract_updated_block: 1000 } as AccountType);

    const shape = await getAccountShape(buildInfo(), syncConfig);

    expect(shape.balance).toEqual(new BigNumber(0));
  });

  it("maps an outgoing operation with a value to a live operation including its fees", async () => {
    listOperationsMock.mockResolvedValue({ items: [buildCoreOperation()], next: undefined });

    const shape = await getAccountShape(buildInfo(), syncConfig);

    const expected: IconOperation = {
      id: encodeOperationId(accountId, "0xhash", "OUT"),
      accountId,
      fee: new BigNumber(10),
      value: new BigNumber(1010),
      type: "OUT",
      hash: "0xhash",
      blockHash: null,
      blockHeight: 12345,
      date,
      senders: [address],
      recipients: ["hx456"],
      extra: {},
      hasFailed: false,
    };
    expect(shape.operations).toEqual([expected]);
  });

  it("keeps a zero value for an outgoing operation without value", async () => {
    listOperationsMock.mockResolvedValue({
      items: [buildCoreOperation({ value: 0n, details: { hasValue: false } })],
      next: undefined,
    });

    const shape = await getAccountShape(buildInfo(), syncConfig);

    expect(shape.operations?.[0].value).toEqual(new BigNumber(0));
  });

  it("maps an incoming operation without adding its fees", async () => {
    listOperationsMock.mockResolvedValue({
      items: [
        buildCoreOperation({
          type: "IN",
          senders: ["hx456"],
          recipients: [address],
          tx: { ...buildCoreOperation().tx, failed: true },
        }),
      ],
      next: undefined,
    });

    const shape = await getAccountShape(buildInfo(), syncConfig);

    expect(shape.operations?.[0]).toMatchObject({
      id: encodeOperationId(accountId, "0xhash", "IN"),
      type: "IN",
      value: new BigNumber(1000),
      hasFailed: true,
    });
  });

  it("walks the pages until no next cursor is returned", async () => {
    listOperationsMock
      .mockResolvedValueOnce({
        items: [buildCoreOperation({ tx: { ...buildCoreOperation().tx, hash: "0xa" } })],
        next: "100",
      })
      .mockResolvedValueOnce({
        items: [buildCoreOperation({ tx: { ...buildCoreOperation().tx, hash: "0xb" } })],
        next: undefined,
      });

    const shape = await getAccountShape(buildInfo(), syncConfig);

    expect(listOperationsMock).toHaveBeenNthCalledWith(1, currency, address, {
      minHeight: 0,
      cursor: undefined,
    });
    expect(listOperationsMock).toHaveBeenNthCalledWith(2, currency, address, {
      minHeight: 0,
      cursor: "100",
    });
    expect(shape.operations?.map(op => op.hash)).toEqual(["0xa", "0xb"]);
  });

  it("stops walking once a page reaches the maximum length", async () => {
    jest
      .mocked(getAccount)
      .mockResolvedValue({ balance: 2, contract_updated_block: 1 } as AccountType);
    listOperationsMock.mockResolvedValue({ items: [buildCoreOperation()], next: "100" });

    await getAccountShape(buildInfo(), syncConfig);

    expect(listOperationsMock).toHaveBeenCalledTimes(1);
  });

  it("merges the new operations with the previously synced ones", async () => {
    const oldOperation = {
      id: "old",
      hash: "0xold",
      date: new Date(1500000000000),
    } as IconOperation;
    listOperationsMock.mockResolvedValue({ items: [buildCoreOperation()], next: undefined });

    const shape = await getAccountShape(buildInfo({ operations: [oldOperation] }), syncConfig);

    expect(shape.operations?.map(op => op.id)).toEqual([
      encodeOperationId(accountId, "0xhash", "OUT"),
      "old",
    ]);
    expect(shape.operationsCount).toBe(2);
  });

  it("returns an empty account shape when the sync fails", async () => {
    jest.mocked(getCurrentBlockHeight).mockRejectedValue(new Error("network"));

    const shape = await getAccountShape(buildInfo(), syncConfig);

    expect(shape).toEqual({
      id: accountId,
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
});
