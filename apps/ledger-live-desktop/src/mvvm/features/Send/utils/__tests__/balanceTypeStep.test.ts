import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { hasBalanceTypeStepFor } from "../balanceTypeStep";

jest.mock("@ledgerhq/live-common/account/index", () => ({
  getAccountCurrency: jest.fn(() => ({ id: "ethereum_sepolia" })),
}));
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: { getBalanceTypeConfig: jest.fn() },
}));

const getBalanceTypeConfig = jest.mocked(sendFeatures.getBalanceTypeConfig);
const account = { type: "TokenAccount", id: "token-1" } as never;

describe("hasBalanceTypeStepFor", () => {
  it("shows the step only when the account has a source to pick", () => {
    getBalanceTypeConfig.mockReturnValue({ getOptions: () => [{ id: "public" }] } as never);
    expect(hasBalanceTypeStepFor(account)).toBe(true);

    getBalanceTypeConfig.mockReturnValue({ getOptions: () => [] } as never);
    expect(hasBalanceTypeStepFor(account)).toBe(false);
  });

  it("skips the step for a currency without balance types or an unknown account", () => {
    getBalanceTypeConfig.mockReturnValue(undefined as never);
    expect(hasBalanceTypeStepFor(account)).toBe(false);
    expect(hasBalanceTypeStepFor(undefined)).toBe(false);
  });
});
