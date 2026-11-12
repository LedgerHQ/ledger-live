import BigNumber from "bignumber.js";
import type { Account, SwapOperation } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/wallet-api-exchange-module";
import { genAccount } from "../../mock/account";
import { getMultipleStatus } from "./getStatus";
import updateAccountSwapStatus, {
  hasSwapsAwaitingPayoutHash,
  isSwapAwaitingPayoutHash,
} from "./updateAccountSwapStatus";

jest.mock("./getStatus", () => ({ getMultipleStatus: jest.fn() }));
const mockedGetMultipleStatus = jest.mocked(getMultipleStatus);

const SWAP_ID = "withdraw-swap-id";
const TX_HASH = "0xpayouthash";

// A perps withdraw entry, kept on the receiving account until its payout tx is known.
const withdrawEntry = (overrides: Partial<SwapOperation> = {}): SwapOperation => ({
  provider: "swapkit_hyperliquid",
  swapId: SWAP_ID,
  status: TransactionStatus.Pending,
  receiverAccountId: "receiver",
  fromAccountId: "hypercore",
  operationId: "",
  fromAmount: new BigNumber(5_000_000),
  toAmount: new BigNumber(1),
  ...overrides,
});

const accountWith = (entry: SwapOperation): Account => ({
  ...genAccount("receiver", { operationsSize: 0 }),
  swapHistory: [entry],
});

describe("updateAccountSwapStatus", () => {
  beforeEach(() => mockedGetMultipleStatus.mockReset());

  it("anchors an entry to the payout tx hash returned with its status", async () => {
    mockedGetMultipleStatus.mockResolvedValue([
      { provider: "swapkit_hyperliquid", swapId: SWAP_ID, status: "finished", txHash: TX_HASH },
    ]);

    const updated = await updateAccountSwapStatus(accountWith(withdrawEntry()));

    expect(updated?.swapHistory[0]).toMatchObject({ status: "finished", operationId: TX_HASH });
  });

  it("keeps polling a finished entry until its payout tx hash is known", async () => {
    mockedGetMultipleStatus.mockResolvedValue([
      { provider: "swapkit_hyperliquid", swapId: SWAP_ID, status: "finished" },
    ]);
    const entry = withdrawEntry({ status: TransactionStatus.Finished });

    const updated = await updateAccountSwapStatus(accountWith(entry));

    expect(mockedGetMultipleStatus).toHaveBeenCalledWith([
      expect.objectContaining({ swapId: SWAP_ID }),
    ]);
    expect(updated).toBeUndefined();
  });

  it("stops polling a refunded entry, which never gets a payout tx", async () => {
    const entry = withdrawEntry({ status: TransactionStatus.Refunded });

    await updateAccountSwapStatus(accountWith(entry));

    expect(mockedGetMultipleStatus).not.toHaveBeenCalled();
  });

  it.each(["", "abc"])("updates the status but ignores a final amount of %p", async finalAmount => {
    mockedGetMultipleStatus.mockResolvedValue([
      { provider: "swapkit_hyperliquid", swapId: SWAP_ID, status: "finished", finalAmount },
    ]);
    const entry = withdrawEntry({ operationId: TX_HASH, finalAmount: new BigNumber(2) });

    const updated = await updateAccountSwapStatus(accountWith(entry));

    expect(updated?.swapHistory[0]).toMatchObject({
      status: "finished",
      finalAmount: new BigNumber(2),
    });
  });

  it("stores a readable final amount", async () => {
    mockedGetMultipleStatus.mockResolvedValue([
      { provider: "swapkit_hyperliquid", swapId: SWAP_ID, status: "finished", finalAmount: "1.5" },
    ]);

    const updated = await updateAccountSwapStatus(
      accountWith(withdrawEntry({ operationId: TX_HASH })),
    );

    expect(updated?.swapHistory[0].finalAmount).toEqual(new BigNumber("1.5"));
  });

  it("keeps the operation id of an anchored entry", async () => {
    mockedGetMultipleStatus.mockResolvedValue([
      { provider: "swapkit_hyperliquid", swapId: SWAP_ID, status: "finished", txHash: "0xother" },
    ]);

    const updated = await updateAccountSwapStatus(
      accountWith(withdrawEntry({ operationId: TX_HASH })),
    );

    expect(updated?.swapHistory[0].operationId).toBe(TX_HASH);
  });

  describe("isSwapAwaitingPayoutHash", () => {
    it("is true for a pending or finished entry not anchored to an operation yet", () => {
      expect(isSwapAwaitingPayoutHash(withdrawEntry())).toBe(true);
      expect(isSwapAwaitingPayoutHash(withdrawEntry({ status: TransactionStatus.Finished }))).toBe(
        true,
      );
    });

    it("is false once anchored, or for a refunded or expired entry that never gets a payout", () => {
      expect(isSwapAwaitingPayoutHash(withdrawEntry({ status: TransactionStatus.Expired }))).toBe(
        false,
      );
      expect(isSwapAwaitingPayoutHash(withdrawEntry({ operationId: TX_HASH }))).toBe(false);
      expect(isSwapAwaitingPayoutHash(withdrawEntry({ status: TransactionStatus.Refunded }))).toBe(
        false,
      );
    });
  });

  it("finds the accounts holding a swap waiting for its payout tx hash", () => {
    expect(hasSwapsAwaitingPayoutHash([accountWith(withdrawEntry())])).toBe(true);
    expect(hasSwapsAwaitingPayoutHash([accountWith(withdrawEntry({ operationId: TX_HASH }))])).toBe(
      false,
    );
  });
});
