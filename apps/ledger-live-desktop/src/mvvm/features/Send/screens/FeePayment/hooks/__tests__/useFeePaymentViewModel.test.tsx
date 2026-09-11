import { renderHook, act } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useFeePaymentViewModel } from "../useFeePaymentViewModel";

const mockSelectTronify = jest.fn();
const mockSelectStandard = jest.fn();
const mockGoToStep = jest.fn();

let mockSponsoredSend: {
  selectedFeeOptionId: "standard" | "tronify";
  selectTronify: jest.Mock;
  selectStandard: jest.Mock;
  savingsFiatFormatted: string | null;
  feeCurrencyTicker: string;
};

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => mockSponsoredSend,
}));

jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: { goToStep: mockGoToStep } }),
}));

describe("useFeePaymentViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSponsoredSend = {
      selectedFeeOptionId: "standard",
      selectTronify: mockSelectTronify,
      selectStandard: mockSelectStandard,
      savingsFiatFormatted: "$1.50",
      feeCurrencyTicker: "TRX",
    };
  });

  it("defaults the Regular option as selected when selectedFeeOptionId is standard", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    const regular = result.current.options.find(option => option.id === "standard");
    const tronify = result.current.options.find(option => option.id === "tronify");

    expect(regular?.selected).toBe(true);
    expect(tronify?.selected).toBe(false);
  });

  it("picking Tronify calls selectTronify then navigates to AMOUNT", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    act(() => {
      result.current.onSelect("tronify");
    });

    expect(mockSelectTronify).toHaveBeenCalledTimes(1);
    expect(mockSelectStandard).not.toHaveBeenCalled();
    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.AMOUNT);
  });

  it("picking Regular calls selectStandard then navigates to AMOUNT", () => {
    mockSponsoredSend.selectedFeeOptionId = "tronify";
    const { result } = renderHook(() => useFeePaymentViewModel());

    act(() => {
      result.current.onSelect("standard");
    });

    expect(mockSelectStandard).toHaveBeenCalledTimes(1);
    expect(mockSelectTronify).not.toHaveBeenCalled();
    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.AMOUNT);
  });

  it("surfaces the Tronify option's savings from the context's savingsFiat/quote", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    const tronify = result.current.options.find(option => option.id === "tronify");
    const regular = result.current.options.find(option => option.id === "standard");

    expect(tronify?.savingsLabel).not.toBeNull();
    expect(regular?.savingsLabel).toBeNull();
  });

  it("shows no savings sublabel for Tronify when the context has no quote yet", () => {
    mockSponsoredSend.savingsFiatFormatted = null;
    const { result } = renderHook(() => useFeePaymentViewModel());

    const tronify = result.current.options.find(option => option.id === "tronify");
    expect(tronify?.savingsLabel).toBeNull();
  });

  it("interpolates the fee currency ticker into the disclaimer", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    expect(result.current.disclaimer).toContain("TRX");
    expect(result.current.disclaimer).not.toContain("USDT");
  });
});
