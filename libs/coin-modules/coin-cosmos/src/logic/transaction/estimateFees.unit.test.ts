import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";

jest.mock("../../prepareTransaction", () => ({
  getEstimatedFees: jest.fn(),
}));
import { getEstimatedFees } from "../../prepareTransaction";
import { estimateFees } from "./estimateFees";

const mockedGetEstimatedFees = getEstimatedFees as jest.Mock;

const sendIntent = {
  intentType: "transaction",
  type: "send",
  sender: "cosmos1sender",
  recipient: "cosmos1recipient",
  amount: 1_000_000n,
  asset: { type: "native" },
} as unknown as TransactionIntent;

describe("logic/transaction/estimateFees", () => {
  it("maps the simulated gas to FeeEstimation value + parameters.gasLimit", async () => {
    mockedGetEstimatedFees.mockResolvedValue({
      gasWanted: new BigNumber("250000"),
      gasWantedFees: new BigNumber("6250"),
    });

    const res = await estimateFees("cosmos", sendIntent);

    expect(res.value).toBe(6250n);
    expect(res.parameters?.gasLimit).toBe("250000");
  });

  it("feeds the neutral message params into getEstimatedFees", async () => {
    mockedGetEstimatedFees.mockResolvedValue({
      gasWanted: new BigNumber("1"),
      gasWantedFees: new BigNumber("1"),
    });

    await estimateFees("cosmos", sendIntent);

    const [params] = mockedGetEstimatedFees.mock.calls[0];
    expect(params.senderAddress).toBe("cosmos1sender");
    expect(params.currencyId).toBe("cosmos");
    expect(params.denom).toBe("uatom");
    expect(params.mode).toBe("send");
    expect(params.recipient).toBe("cosmos1recipient");
    expect(params.amount.toFixed()).toBe("1000000");
  });
});
