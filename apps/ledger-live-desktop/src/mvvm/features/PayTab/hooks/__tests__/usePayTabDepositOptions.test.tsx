import { act, renderHook } from "@testing-library/react";
import { useNavigate } from "react-router";
import { useOpenAssetFlow } from "../../../ModularDialog/hooks/useOpenAssetFlow";
import { usePayTabDepositOptions } from "../usePayTabDepositOptions";

const mockNavigate = jest.fn();
const mockOpenAssetFlow = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("../../../ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: jest.fn(() => ({
    openAssetFlow: mockOpenAssetFlow,
    openAddAccountFlow: jest.fn(),
  })),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockedUseOpenAssetFlow = jest.mocked(useOpenAssetFlow);

const STABLECOIN_IDS = ["ethereum/erc20/usd__coin", "ethereum/erc20/usd_tether__erc20_"];

function render(onTrackEvent = jest.fn()) {
  return renderHook(() => usePayTabDepositOptions(onTrackEvent, STABLECOIN_IDS));
}

describe("usePayTabDepositOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockedUseOpenAssetFlow.mockReturnValue({
      openAssetFlow: mockOpenAssetFlow,
      openAddAccountFlow: jest.fn(),
    });
  });

  it("builds i18n labels for the title and the four options", () => {
    const { result } = render();

    const { labels, page } = result.current.depositOptions;
    expect(page).toBe("Pay");
    expect(labels.title).toBeTruthy();
    (["bankTransfer", "swap", "receive", "buy"] as const).forEach(id => {
      expect(labels.options[id].title).toBeTruthy();
      expect(labels.options[id].description).toBeTruthy();
    });
  });

  it("passes the host tracking callback through", () => {
    const onTrackEvent = jest.fn();
    const { result } = render(onTrackEvent);

    expect(result.current.depositOptions.onTrackEvent).toBe(onTrackEvent);
  });

  it("toggles isOpen via open and onClose", () => {
    const { result } = render();

    expect(result.current.depositOptions.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.depositOptions.isOpen).toBe(true);

    act(() => result.current.depositOptions.onClose());
    expect(result.current.depositOptions.isOpen).toBe(false);
  });

  it("navigates to the bank flow for bankTransfer", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("bankTransfer"));

    expect(mockNavigate).toHaveBeenCalledWith("/bank");
  });

  it("navigates to the swap tab for swap", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("swap"));

    expect(mockNavigate).toHaveBeenCalledWith("/swap");
  });

  it("navigates to the buy live app for buy", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("buy"));

    expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
      state: { mode: "buy", returnTo: "/paytab" },
    });
  });

  it("opens the asset flow filtered to stablecoins for receive", () => {
    const { result } = render();

    act(() => result.current.depositOptions.onSelect("receive"));

    expect(mockOpenAssetFlow).toHaveBeenCalledWith(undefined, STABLECOIN_IDS);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("skips receive options when opening receive from Pay", () => {
    render();

    expect(mockedUseOpenAssetFlow).toHaveBeenCalledWith(expect.anything(), "Pay", "MODAL_RECEIVE", {
      shouldUseReceiveOptions: false,
    });
  });
});
