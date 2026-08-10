import type { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Transaction, TronAccount } from "../types";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getEstimatedFees, {
  computeSponsoredUsdtFee,
  getFeeResourceBreakdown,
  type FeeResourceBreakdown,
} from "./getEstimateFees";

jest.mock("./getEstimateFees");

const mockGetEstimatedFees = jest.mocked(getEstimatedFees);
const mockGetFeeResourceBreakdown = jest.mocked(getFeeResourceBreakdown);
const mockComputeSponsoredUsdtFee = jest.mocked(computeSponsoredUsdtFee);

const SENDER_ADDRESS = "TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3";

const parentAccount = {
  type: "Account",
  freshAddress: SENDER_ADDRESS,
  balance: new BigNumber(50_000_000),
  spendableBalance: new BigNumber(50_000_000),
} as unknown as TronAccount;

const tokenAccount = {
  type: "TokenAccount",
  id: "js:2:tron:sender:+trc20",
  balance: new BigNumber(1_000_000),
} as unknown as TokenAccount;

const energyProviderInfo = { providerId: "tronify", orderId: "order-1" };

const breakdown = {
  energyRequired: new BigNumber(65_000),
  energyEstimated: true,
} as unknown as FeeResourceBreakdown;

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFeeResourceBreakdown.mockResolvedValue(breakdown);
    mockComputeSponsoredUsdtFee.mockResolvedValue(new BigNumber(0));
  });

  it("parent (TRX) account: spendable balance minus network fees", async () => {
    mockGetEstimatedFees.mockResolvedValue(new BigNumber(1_000_000));

    const max = await estimateMaxSpendable({ account: parentAccount, parentAccount: undefined });

    expect(max).toEqual(new BigNumber(49_000_000));
    // Token-only helpers are not touched for a native account.
    expect(mockComputeSponsoredUsdtFee).not.toHaveBeenCalled();
  });

  it("non-sponsored token account: full token balance, no fee estimation", async () => {
    const max = await estimateMaxSpendable({
      account: tokenAccount,
      parentAccount,
      transaction: { recipient: SENDER_ADDRESS } as Transaction,
    });

    expect(max).toEqual(new BigNumber(1_000_000));
    // No sponsored context → no rental quote and no (unused) fee estimation for the token account.
    expect(mockComputeSponsoredUsdtFee).not.toHaveBeenCalled();
    expect(mockGetEstimatedFees).not.toHaveBeenCalled();
  });

  it("sponsored token account: balance minus the reserved USDT rental fee", async () => {
    mockComputeSponsoredUsdtFee.mockResolvedValue(new BigNumber(300_000));

    const max = await estimateMaxSpendable({
      account: tokenAccount,
      parentAccount,
      transaction: { recipient: SENDER_ADDRESS, energyProviderInfo } as Transaction,
    });

    expect(max).toEqual(new BigNumber(700_000)); // 1_000_000 − 300_000
    // The rental breakdown is computed with useAllAmount so the energy sim uses the token balance.
    expect(mockGetFeeResourceBreakdown).toHaveBeenCalledWith(
      parentAccount,
      expect.objectContaining({ useAllAmount: true }),
      tokenAccount,
    );
  });

  it("clamps to 0 when the reserved fee exceeds the token balance", async () => {
    mockComputeSponsoredUsdtFee.mockResolvedValue(new BigNumber(2_000_000));

    const max = await estimateMaxSpendable({
      account: tokenAccount,
      parentAccount,
      transaction: { recipient: SENDER_ADDRESS, energyProviderInfo } as Transaction,
    });

    expect(max).toEqual(new BigNumber(0));
  });
});
