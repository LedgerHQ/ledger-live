import BigNumber from "bignumber.js";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getFees } from "./network";
import { buildAccount, buildTokenAccount, MEX_BALANCE } from "./test/fixtures";

jest.mock("./network", () => ({ getFees: jest.fn() }));

const mockGetFees = getFees as jest.Mock;

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    mockGetFees.mockReset();
  });

  it("returns the spendable balance minus the fees", async () => {
    mockGetFees.mockResolvedValue(new BigNumber(50000));
    const account = buildAccount({ balance: "1000000" });

    const max = await estimateMaxSpendable({ account });

    expect(max.toString()).toBe("950000");
  });

  it("returns zero when the fees exceed the spendable balance", async () => {
    mockGetFees.mockResolvedValue(new BigNumber(50000));
    const account = buildAccount({ balance: "100" });

    const max = await estimateMaxSpendable({ account });

    expect(max.toString()).toBe("0");
  });

  it("returns the token balance for an ESDT sub account without fetching fees", async () => {
    const parentAccount = buildAccount({ withToken: true });
    const tokenAccount = buildTokenAccount();

    const max = await estimateMaxSpendable({ account: tokenAccount, parentAccount });

    expect({ max: max.toString(), feesFetched: mockGetFees.mock.calls.length }).toEqual({
      max: MEX_BALANCE,
      feesFetched: 0,
    });
  });
});
