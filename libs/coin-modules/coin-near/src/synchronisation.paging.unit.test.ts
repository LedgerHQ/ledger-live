import BigNumber from "bignumber.js";
import type { NearTransaction } from "./network/sdk.types";
import { setCoinConfig } from "./config";
import { fetchAccountDetails, getAccount, getAccountStateFingerprint } from "./network";
import { fetchNearblocks } from "./network/nearblocks";
import { getAccountShape } from "./synchronisation";
import { mockNearConfig } from "./test/context";
import type { NearAccount } from "./types";

jest.mock("./network", () => ({
  ...jest.requireActual("./network/indexer"),
  fetchAccountDetails: jest.fn(),
  getAccount: jest.fn(),
  getAccountStateFingerprint: jest.fn(),
}));
jest.mock("./network/nearblocks", () => ({ fetchNearblocks: jest.fn() }));

const ADDRESS = "delegator.near";

const txn = (hash: string, timestamp: number): NearTransaction =>
  ({
    signer_account_id: ADDRESS,
    receiver_account_id: "receiver.near",
    transaction_hash: hash,
    block_timestamp: String(timestamp),
    block: { block_hash: "b", block_height: "1", block_timestamp: String(timestamp) },
    outcomes: { status: true },
    outcomes_agg: { transaction_fee: "0" },
    actions_agg: { deposit: "1" },
    actions: [{ action: "TRANSFER", method: null }],
  }) as unknown as NearTransaction;

// Newest first, as the indexer lists them.
const listed = (hashes: string[]): NearTransaction[] =>
  hashes.map((hash, index) => txn(hash, (1_800_000_000 - index) * 1_000_000_000));

const newer = Array.from({ length: 24 }, (_, index) => `n${index}`);

const servePages = (pages: NearTransaction[][]): void => {
  (fetchNearblocks as jest.Mock).mockImplementation(async (_config: unknown, path: string) => {
    const cursor = new URL(`http://x${path}`).searchParams.get("next");
    const index = cursor === null ? 0 : Number(cursor.replace("page-", ""));
    return {
      data: pages[index],
      ...(index + 1 < pages.length && { meta: { next_page: `page-${index + 1}` } }),
    };
  });
};

const runSync = (initialAccount: NearAccount) =>
  getAccountShape(
    { address: ADDRESS, initialAccount, currency: { id: "near" }, derivationMode: "" } as never,
    { blacklistedTokenIds: [] } as never,
  );

const oldOperation = {
  id: "js:2:near:delegator.near::old-OUT",
  hash: "old",
  accountId: "js:2:near:delegator.near:",
  type: "OUT",
  value: new BigNumber(1),
  fee: new BigNumber(0),
  senders: [ADDRESS],
  recipients: [],
  blockHash: null,
  blockHeight: 1,
  date: new Date(1_700_000_000_000),
  extra: {},
} as unknown as NearAccount["operations"][number];

const storedWith = (
  operations: NearAccount["operations"],
  nearResources: Record<string, unknown> = {},
): NearAccount =>
  ({
    operations,
    pendingOperations: [],
    nearResources: { stakingPositions: [], accountStateFingerprint: "fp-old", ...nearResources },
  }) as unknown as NearAccount;

describe("legacy sync confirmation across pages", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setCoinConfig(() => mockNearConfig);
    (fetchAccountDetails as jest.Mock).mockResolvedValue({ amount: "1" });
    (getAccountStateFingerprint as jest.Mock).mockResolvedValue("fp-new");
    (getAccount as jest.Mock).mockResolvedValue({
      blockHeight: 1,
      balance: new BigNumber(1),
      spendableBalance: new BigNumber(1),
      nearResources: { stakingPositions: [] },
      poolListingFailed: false,
      failedCandidates: [],
    });
  });

  it("finds a transaction the indexer lists late on the second page", async () => {
    // The stored history holds "old"; the first read joins it on its only page.
    servePages([listed([...newer, "old"])]);
    const first = await runSync(storedWith([oldOperation]));
    const boundary = first.nearResources?.historyConfirmBoundary;

    expect(boundary).toBe("old");
    expect(first.nearResources?.historyConfirmPending).toBe(true);

    // The late transaction now shows below a full page of newer ones: only a read that pages up to
    // the boundary reaches it.
    servePages([listed([...newer, "n24"]), listed(["late", "old"])]);
    const second = await runSync(storedWith(first.operations ?? [], first.nearResources));

    expect(second.operations?.map(op => op.hash)).toContain("late");
    // It found something new, so one more confirmation follows from the same boundary.
    expect(second.nearResources?.historyConfirmBoundary).toBe("old");

    const third = await runSync(storedWith(second.operations ?? [], second.nearResources));

    expect(third.nearResources).not.toHaveProperty("historyConfirmBoundary");
    expect(third.nearResources).not.toHaveProperty("historyConfirmPending");
  });
});
