import { renderHook, act } from "tests/testSetup";
import { BigNumber } from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import {
  createMockAccount,
  createMockCurrency,
  createMockTronUsdtAccount,
} from "../../../Recipient/__integrations__/__fixtures__/accounts";
import type { FeePaymentOption, SponsoredFeeAmounts } from "LLD/features/Send/types";
import { openURL } from "~/renderer/linking";
import { useFeePaymentViewModel } from "../useFeePaymentViewModel";

const SPONSORED_ID = "sponsored-fixture";

const mockSelectSponsored = jest.fn();
const mockSelectStandard = jest.fn();
const mockGoToPreviousStep = jest.fn();

let mockSponsoredSend: {
  selectedFeeOptionId: string;
  sponsoredFeeOptionId: string;
  providerName: string;
  selectSponsored: jest.Mock;
  selectStandard: jest.Mock;
  sponsoredFeeAmounts: SponsoredFeeAmounts | null;
  feeCurrencyTicker: string;
  feeTokenAccount: TokenAccount | null;
  sponsoredMaxAmount: BigNumber | null;
};

jest.mock("../../../../context/SponsoredSendContext", () => ({
  STANDARD_FEE_OPTION_ID: "standard",
  useSponsoredSend: () => mockSponsoredSend,
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: {
      account: {
        account: createMockAccount({ currency: createMockCurrency({ id: "tron" }) }),
        parentAccount: null,
      },
    },
  }),
}));

jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: { goToPreviousStep: mockGoToPreviousStep } }),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: () => "https://support.ledger.com/gas-sponsorship",
}));
jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));
const mockedOpenURL = jest.mocked(openURL);

const findSponsored = (options: readonly FeePaymentOption[]) =>
  options.find(option => option.id === SPONSORED_ID);
const findRegular = (options: readonly FeePaymentOption[]) =>
  options.find(option => option.id === "standard");

describe("useFeePaymentViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSponsoredSend = {
      selectedFeeOptionId: "standard",
      sponsoredFeeOptionId: SPONSORED_ID,
      providerName: "Provider",
      selectSponsored: mockSelectSponsored,
      selectStandard: mockSelectStandard,
      sponsoredFeeAmounts: {
        sponsored: { value: "$3.22", secondaryValue: "3.22324 USDT", originalValue: "$4.12" },
        standard: { value: "$4.12", secondaryValue: "2.32923 TRX" },
      },
      feeCurrencyTicker: "USDT",
      feeTokenAccount: createMockTronUsdtAccount(),
      sponsoredMaxAmount: new BigNumber(6_768_000),
    };
  });

  it("lists the sponsored option before Regular", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    expect(result.current.options.map(option => option.id)).toEqual([SPONSORED_ID, "standard"]);
  });

  it("marks the current fee option as selected", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    expect(findRegular(result.current.options)?.selected).toBe(true);
    expect(findSponsored(result.current.options)?.selected).toBe(false);
  });

  it("labels each option with its provider and the currency it is paid in", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    expect(findSponsored(result.current.options)).toMatchObject({
      label: "Pay with Provider",
      paidInLabel: "Paid in USDT",
    });
    expect(findRegular(result.current.options)).toMatchObject({
      label: "Regular transfer",
      paidInLabel: "Paid in TRX",
    });
  });

  it("labels the Confirm button", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    expect(result.current.confirmLabel).toBe("Confirm");
  });

  it("prices each option with its own fee, striking the standard price only on the sponsored one", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    expect(findSponsored(result.current.options)?.fee).toEqual({
      value: "$3.22",
      secondaryValue: "3.22324 USDT",
      originalValue: "$4.12",
    });
    expect(findRegular(result.current.options)?.fee).toEqual({
      value: "$4.12",
      secondaryValue: "2.32923 TRX",
      originalValue: null,
    });
  });

  it("shows no fee on either option before a quote", () => {
    mockSponsoredSend.sponsoredFeeAmounts = null;
    const { result } = renderHook(() => useFeePaymentViewModel());

    expect(result.current.options.map(option => option.fee)).toEqual([null, null]);
  });

  it("only marks a picked option, leaving the send untouched until Confirm", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    act(() => {
      result.current.onSelect(SPONSORED_ID);
    });

    expect(findSponsored(result.current.options)?.selected).toBe(true);
    expect(findRegular(result.current.options)?.selected).toBe(false);
    expect(mockSelectSponsored).not.toHaveBeenCalled();
    expect(mockGoToPreviousStep).not.toHaveBeenCalled();
  });

  it("applies the picked sponsored option on Confirm, then returns to the previous step", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    act(() => {
      result.current.onSelect(SPONSORED_ID);
    });
    act(() => {
      result.current.onConfirm();
    });

    expect(mockSelectSponsored).toHaveBeenCalledTimes(1);
    expect(mockSelectStandard).not.toHaveBeenCalled();
    expect(mockGoToPreviousStep).toHaveBeenCalledTimes(1);
  });

  it("applies the picked Regular option on Confirm, then returns to the previous step", () => {
    mockSponsoredSend.selectedFeeOptionId = SPONSORED_ID;
    const { result } = renderHook(() => useFeePaymentViewModel());

    act(() => {
      result.current.onSelect("standard");
    });
    act(() => {
      result.current.onConfirm();
    });

    expect(mockSelectStandard).toHaveBeenCalledTimes(1);
    expect(mockSelectSponsored).not.toHaveBeenCalled();
    expect(mockGoToPreviousStep).toHaveBeenCalledTimes(1);
  });

  it("only returns to the previous step when Confirm keeps the current option", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    act(() => {
      result.current.onConfirm();
    });

    expect(mockSelectStandard).not.toHaveBeenCalled();
    expect(mockSelectSponsored).not.toHaveBeenCalled();
    expect(mockGoToPreviousStep).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["Regular", "standard"],
    ["the sponsored option", SPONSORED_ID],
  ])("discloses the third-party provider while %s is selected", (_, selectedFeeOptionId) => {
    mockSponsoredSend.selectedFeeOptionId = selectedFeeOptionId;
    const { result } = renderHook(() => useFeePaymentViewModel());

    expect(result.current.disclaimer).toBe(
      "With Provider, a third-party energy provider, fees are paid in USDT.",
    );
  });

  it("opens the gas sponsorship article from Learn more", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    expect(result.current.learnMoreLabel).toBe("Learn more");
    act(() => result.current.onLearnMore());

    expect(mockedOpenURL).toHaveBeenCalledWith("https://support.ledger.com/gas-sponsorship");
  });

  it("lets both options be picked while the fee token covers the rent", () => {
    const { result } = renderHook(() => useFeePaymentViewModel());

    expect(result.current.options.map(option => option.disabled)).toEqual([false, false]);
    expect(result.current.options.map(option => option.note)).toEqual([null, null]);
    expect(result.current.confirmDisabled).toBe(false);
  });

  it.each([
    ["nothing is left after the rent", { sponsoredMaxAmount: new BigNumber(0) }],
    ["the account holds none of the fee token", { feeTokenAccount: null }],
  ])("disables the sponsored option and says why when %s", (_, overrides) => {
    mockSponsoredSend = { ...mockSponsoredSend, ...overrides };
    const { result } = renderHook(() => useFeePaymentViewModel());

    const sponsored = findSponsored(result.current.options);

    expect(sponsored?.disabled).toBe(true);
    expect(sponsored?.note).toBe(
      "You don't have enough USDT to cover the amount and the Provider energy rental fee.",
    );
    expect(findRegular(result.current.options)?.disabled).toBe(false);
  });

  it("ignores a pick of the disabled sponsored option", () => {
    mockSponsoredSend.sponsoredMaxAmount = new BigNumber(0);
    const { result } = renderHook(() => useFeePaymentViewModel());

    act(() => {
      result.current.onSelect(SPONSORED_ID);
    });

    expect(findSponsored(result.current.options)?.selected).toBe(false);
    expect(findRegular(result.current.options)?.selected).toBe(true);
  });

  it("blocks Confirm while the selected sponsored option can no longer be paid", () => {
    mockSponsoredSend.selectedFeeOptionId = SPONSORED_ID;
    mockSponsoredSend.sponsoredMaxAmount = new BigNumber(0);
    const { result } = renderHook(() => useFeePaymentViewModel());

    act(() => {
      result.current.onConfirm();
    });

    expect(result.current.confirmDisabled).toBe(true);
    expect(mockGoToPreviousStep).not.toHaveBeenCalled();
  });
});
