import { renderHook } from "@testing-library/react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useSendFlowTrackingProperties } from "../useSendFlowTrackingProperties";
import { useSendFlowData } from "../../context/SendFlowContext";

jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: { getTrackingAttributes: jest.fn(() => ({})) },
}));
jest.mock("../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));

const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedGetTrackingAttributes = jest.mocked(sendFeatures.getTrackingAttributes);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);

const zcashCurrency = { id: "zcash" };
const zcashAccount = { id: "zcash-account", type: "Account" as const };

function mockFlow({
  currency = null,
  transaction = null,
  source,
}: {
  currency?: unknown;
  transaction?: unknown;
  source?: string;
} = {}) {
  mockedUseSendFlowData.mockReturnValue({
    state: {
      account: { account: zcashAccount, parentAccount: null, currency },
      transaction: { transaction },
    },
    source,
  } as never);
}

describe("useSendFlowTrackingProperties", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountCurrency.mockReturnValue(zcashCurrency as never);
  });

  it("spreads the family-agnostic tracking attributes into the base properties", () => {
    const transaction = { family: "zcash", sender: "private", transferType: "shielded" };
    mockedGetTrackingAttributes.mockReturnValue({ privacy: "private", flow: "private-to-private" });
    mockFlow({ currency: zcashCurrency, transaction });

    const { result } = renderHook(() => useSendFlowTrackingProperties());

    expect(mockedGetTrackingAttributes).toHaveBeenCalledWith(zcashCurrency, transaction);
    expect(result.current).toEqual(
      expect.objectContaining({ privacy: "private", flow: "private-to-private" }),
    );
  });

  it("adds no attribute when the descriptor returns none (e.g. before a source pool is picked)", () => {
    mockedGetTrackingAttributes.mockReturnValue({});
    mockFlow({ currency: zcashCurrency, transaction: { family: "zcash" } });

    const { result } = renderHook(() => useSendFlowTrackingProperties());

    expect(result.current).not.toHaveProperty("privacy");
    expect(result.current).not.toHaveProperty("flow");
  });

  it("falls back to deriving the currency from the account when state.account.currency is unset", () => {
    mockFlow({ currency: null, transaction: null });

    renderHook(() => useSendFlowTrackingProperties());

    expect(mockedGetAccountCurrency).toHaveBeenCalledWith(zcashAccount);
    expect(mockedGetTrackingAttributes).toHaveBeenCalledWith(zcashCurrency, null);
  });
});
