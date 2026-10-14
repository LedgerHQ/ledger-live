import { act, renderHook, waitFor } from "@testing-library/react-native";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { useSponsoredRentSignatureViewModel } from "../useSponsoredRentSignatureViewModel";

const mockStopSigning = jest.fn();
const mockActions = {
  craftRent: jest.fn((_approvedFee: bigint | null) => Promise.resolve()),
  startRentPayment: jest.fn(),
  reset: jest.fn(),
};
let mockSponsoredState: Record<string, unknown>;
let mockAccount: Record<string, unknown>;

jest.mock("~/context/hooks", () => ({
  useSelector: (selector: () => unknown) => selector(),
}));
jest.mock("~/reducers/settings", () => ({
  localeSelector: () => "en",
}));
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key} ${JSON.stringify(params)}` : key,
  }),
}));
jest.mock("@features/platform-device-intent", () => ({
  createIntent: (_definition: unknown, input: unknown) => ({ input }),
}));
jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
}));
jest.mock("../../intents/signRawTransactionIntent/intentLWMDefinition", () => ({
  signRawTransactionIntentLWMDefinition: {},
}));
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: { account: { account: mockAccount, parentAccount: null } },
  }),
}));
jest.mock("../../../../context/SendSignatureContext", () => ({
  useSendSignature: () => ({ stopSigning: mockStopSigning }),
}));
jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({
    state: mockSponsoredState,
    actions: mockActions,
    providerName: "Provider",
    approvedFee: 3_200_000n,
  }),
}));

const ORDER = { orderId: "o1" };
const RENT_PAYMENT = {
  asset: { type: "trc20", unit: { name: "USDT", code: "USDT", magnitude: 6 } },
  amount: 3_200_000n,
};
const SIGNED = { type: "signed", signedOperation: { signature: "sig" } } as never;

const crafted = (overrides: Record<string, unknown> = {}) => ({
  phase: SPONSORED_PHASE.RENT_SIGNING,
  order: ORDER,
  toSign: "0adeadbeef",
  paymentTxId: "txA",
  rentPayment: RENT_PAYMENT,
  ...overrides,
});

const renderViewModel = () => renderHook(() => useSponsoredRentSignatureViewModel());

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(buildDeviceInitializationInput).mockResolvedValue({ device: "input" } as never);
  mockAccount = { type: "Account", id: "tron" };
  mockSponsoredState = {
    phase: SPONSORED_PHASE.IDLE,
    order: null,
    toSign: null,
    paymentTxId: null,
    rentPayment: null,
  };
});

describe("useSponsoredRentSignatureViewModel", () => {
  it.each([
    ["at Review", SPONSORED_PHASE.IDLE],
    ["on a retry that cleared the order", SPONSORED_PHASE.RENT_SIGNING],
  ])("crafts TX-A %s", (_label, phase) => {
    mockSponsoredState = { ...mockSponsoredState, phase };

    const { result } = renderViewModel();

    expect(mockActions.craftRent).toHaveBeenCalledTimes(1);
    expect(mockActions.craftRent).toHaveBeenCalledWith(3_200_000n);
    expect(result.current.step).toEqual({ type: "loading" });
  });

  it.each([
    ["an order is already crafted", crafted()],
    ["TX-A is paid", crafted({ phase: SPONSORED_PHASE.TRANSFER })],
  ])("doesn't craft when %s", (_label, state) => {
    mockSponsoredState = state;

    renderViewModel();

    expect(mockActions.craftRent).not.toHaveBeenCalled();
  });

  it("signs the crafted bytes, naming the provider and the rent", async () => {
    mockSponsoredState = crafted();

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.step.type).toBe("signing"));
    expect(result.current.step).toEqual({
      type: "signing",
      deviceInitializationInput: { device: "input" },
      signIntent: {
        input: { account: mockAccount, parentAccount: null, transaction: "0adeadbeef" },
      },
    });
    expect(result.current.feeAmountLabel).toMatch(/3\.2.*USDT/);
    expect(result.current.intentExtraProps.strategyLabel).toContain("Provider");
    expect(result.current.intentExtraProps.feeLabel).toMatch(/3\.2.*USDT/);
  });

  // The executor drops an operation whose intent or device input changes mid-signing.
  it("keeps the intent and the device input across an account refresh", async () => {
    mockSponsoredState = crafted();
    const { result, rerender } = renderViewModel();
    await waitFor(() => expect(result.current.step.type).toBe("signing"));
    const before = result.current.step;

    mockAccount = { ...mockAccount };
    rerender({});

    const after = result.current.step;
    if (before.type !== "signing" || after.type !== "signing") throw new Error("expected signing");
    expect(after.signIntent).toBe(before.signIntent);
    expect(after.deviceInitializationInput).toBe(before.deviceInitializationInput);
    expect(buildDeviceInitializationInput).toHaveBeenCalledTimes(1);
  });

  it("shows the device setup failure instead of loading forever", async () => {
    jest.mocked(buildDeviceInitializationInput).mockRejectedValue(new Error("module load"));
    mockSponsoredState = crafted();

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.step.type).toBe("error"));
  });

  it("submits a signed TX-A once per order, tied to the payment it signed", () => {
    mockSponsoredState = crafted();
    const { result } = renderViewModel();

    act(() => result.current.onIntentJobStateChanged(SIGNED));
    act(() => result.current.onIntentJobStateChanged(SIGNED));

    expect(mockActions.startRentPayment).toHaveBeenCalledTimes(1);
    expect(mockActions.startRentPayment).toHaveBeenCalledWith("sig", "txA");
  });

  it("ignores job states other than signed", () => {
    mockSponsoredState = crafted();
    const { result } = renderViewModel();

    act(() => result.current.onIntentJobStateChanged({ type: "pending" } as never));

    expect(mockActions.startRentPayment).not.toHaveBeenCalled();
  });

  it("leaves a sign error to the executor's screen, so cancelling still drops the order", () => {
    mockSponsoredState = crafted();
    const { result } = renderViewModel();

    act(() => result.current.onIntentJobError(new Error("locked")));
    act(() => result.current.onUserCancel());

    expect(mockActions.startRentPayment).not.toHaveBeenCalled();
    expect(mockStopSigning).toHaveBeenCalled();
    expect(mockActions.reset).toHaveBeenCalled();
  });

  it("closes the overlay and resets the order on cancel", () => {
    mockSponsoredState = crafted();
    const { result } = renderViewModel();

    act(() => result.current.onUserCancel());

    expect(mockStopSigning).toHaveBeenCalled();
    expect(mockActions.reset).toHaveBeenCalled();
  });

  // The sheet calls onUserCancel when it unmounts, which it does as the flow moves on.
  it("keeps the flow once TX-A is signed", () => {
    mockSponsoredState = crafted();
    const { result } = renderViewModel();

    act(() => result.current.onIntentJobStateChanged(SIGNED));
    act(() => result.current.onUserCancel());

    expect(mockStopSigning).not.toHaveBeenCalled();
    expect(mockActions.reset).not.toHaveBeenCalled();
  });
});
