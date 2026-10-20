import { track } from "@shared/analytics";
import { act, renderHook } from "@testing-library/react-native";
import { Linking } from "react-native";
import { BigNumber } from "bignumber.js";
import type {
  FeePaymentOption,
  SponsoredFeeAmounts,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useFeePaymentSheetViewModel } from "../useFeePaymentSheetViewModel";

const SPONSORED_ID = "sponsored-fixture";

const mockSelectSponsored = jest.fn();
const mockSelectStandard = jest.fn();
const onDone = jest.fn();

let mockSponsoredSend: {
  mainAccount: { currency: { ticker: string } } | null;
  selectedFeeOptionId: string;
  sponsoredFeeOptionId: string;
  providerName: string;
  selectSponsored: jest.Mock;
  selectStandard: jest.Mock;
  sponsoredFeeAmounts: SponsoredFeeAmounts | null;
  feeCurrencyTicker: string;
  feeTokenAccount: { id: string } | null;
  sponsoredMaxAmount: BigNumber | null;
};

jest.mock("../../../context/SponsoredSendContext", () => ({
  STANDARD_FEE_OPTION_ID: "standard",
  useSponsoredSend: () => mockSponsoredSend,
}));
jest.mock("../../../context/SendFlowTrackingContext", () => ({
  useSendFlowTracking: () => ({ flowSessionId: "session-1" }),
}));
jest.mock("../../../hooks/useSendFlowTrackingProperties", () => ({
  useSendFlowTrackingProperties: () => ({ flow: "send" }),
}));
jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: () => "https://support.ledger.com/gas-sponsorship",
}));

const mockedTrack = jest.mocked(track);
const mockedOpenURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

const findSponsored = (options: readonly FeePaymentOption[]) =>
  options.find(option => option.id === SPONSORED_ID);
const findRegular = (options: readonly FeePaymentOption[]) =>
  options.find(option => option.id === "standard");

const render = () => renderHook(() => useFeePaymentSheetViewModel({ onDone }));

describe("useFeePaymentSheetViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSponsoredSend = {
      mainAccount: { currency: { ticker: "TRX" } },
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
      feeTokenAccount: { id: "usdt" },
      sponsoredMaxAmount: new BigNumber(6_768_000),
    };
  });

  it("lists the sponsored option before Regular, with the current pick selected", () => {
    const { result } = render();

    expect(result.current.options.map(option => [option.id, option.selected])).toEqual([
      [SPONSORED_ID, false],
      ["standard", true],
    ]);
  });

  it("labels each option with its provider and the currency it is paid in", () => {
    const { result } = render();

    expect(result.current.title).toBe("Select fee payment");
    expect(result.current.confirmLabel).toBe("Confirm");
    expect(findSponsored(result.current.options)).toMatchObject({
      label: "Pay with Provider",
      paidInLabel: "Paid in USDT",
    });
    expect(findRegular(result.current.options)).toMatchObject({
      label: "Regular transfer",
      paidInLabel: "Paid in TRX",
    });
  });

  it("prices each option with its own fee, striking the standard price only on the sponsored one", () => {
    const { result } = render();

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
    const { result } = render();

    expect(result.current.options.map(option => option.fee)).toEqual([null, null]);
  });

  it("discloses the third-party provider and links to the gas sponsorship article", () => {
    const { result } = render();

    expect(result.current.disclaimer).toBe(
      "With Provider, a third-party energy provider, fees are paid in USDT.",
    );
    expect(result.current.learnMoreLabel).toBe("Learn more");

    act(() => result.current.onLearnMore());

    expect(mockedOpenURL).toHaveBeenCalledWith("https://support.ledger.com/gas-sponsorship");
  });

  it("only marks a picked option, leaving the send untouched until Confirm", () => {
    const { result } = render();

    act(() => result.current.onSelect(SPONSORED_ID));

    expect(findSponsored(result.current.options)?.selected).toBe(true);
    expect(mockSelectSponsored).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("applies the picked sponsored option on Confirm, tracks it, then closes", () => {
    const { result } = render();

    act(() => result.current.onSelect(SPONSORED_ID));
    act(() => result.current.onConfirm());

    expect(mockSelectSponsored).toHaveBeenCalledTimes(1);
    expect(mockSelectStandard).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      button: "confirm",
      page: "step fee payment",
      fee_option: SPONSORED_ID,
      flow_session_id: "session-1",
      flow: "send",
    });
  });

  it("applies the picked Regular option on Confirm, then closes", () => {
    mockSponsoredSend.selectedFeeOptionId = SPONSORED_ID;
    const { result } = render();

    act(() => result.current.onSelect("standard"));
    act(() => result.current.onConfirm());

    expect(mockSelectStandard).toHaveBeenCalledTimes(1);
    expect(mockSelectSponsored).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("only closes when Confirm keeps the current option", () => {
    const { result } = render();

    act(() => result.current.onConfirm());

    expect(mockSelectStandard).not.toHaveBeenCalled();
    expect(mockSelectSponsored).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("lets both options be picked while the fee token covers the rent", () => {
    const { result } = render();

    expect(result.current.options.map(option => option.disabled)).toEqual([false, false]);
    expect(result.current.options.map(option => option.note)).toEqual([null, null]);
    expect(result.current.confirmDisabled).toBe(false);
  });

  it.each([
    ["nothing is left after the rent", { sponsoredMaxAmount: new BigNumber(0) }],
    ["the account holds none of the fee token", { feeTokenAccount: null }],
  ])("disables the sponsored option and says why when %s", (_, overrides) => {
    mockSponsoredSend = { ...mockSponsoredSend, ...overrides };
    const { result } = render();

    const sponsored = findSponsored(result.current.options);

    expect(sponsored?.disabled).toBe(true);
    expect(sponsored?.note).toBe(
      "You don't have enough USDT to cover the amount and the Provider energy rental fee.",
    );
    expect(findRegular(result.current.options)?.disabled).toBe(false);
  });

  it("ignores a pick of the disabled sponsored option", () => {
    mockSponsoredSend.sponsoredMaxAmount = new BigNumber(0);
    const { result } = render();

    act(() => result.current.onSelect(SPONSORED_ID));

    expect(findSponsored(result.current.options)?.selected).toBe(false);
    expect(findRegular(result.current.options)?.selected).toBe(true);
  });

  it("starts from the current pick again once the sheet closes unconfirmed", () => {
    const { result } = render();
    act(() => result.current.onSelect(SPONSORED_ID));

    act(() => result.current.onClose());

    expect(findSponsored(result.current.options)?.selected).toBe(false);
    expect(findRegular(result.current.options)?.selected).toBe(true);
  });

  it("blocks Confirm while the selected sponsored option can no longer be paid", () => {
    mockSponsoredSend.selectedFeeOptionId = SPONSORED_ID;
    mockSponsoredSend.sponsoredMaxAmount = new BigNumber(0);
    const { result } = render();

    act(() => result.current.onConfirm());

    expect(result.current.confirmDisabled).toBe(true);
    expect(onDone).not.toHaveBeenCalled();
    expect(mockedTrack).not.toHaveBeenCalled();
  });
});
