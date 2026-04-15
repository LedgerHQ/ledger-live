import { renderHook, act } from "tests/testSetup";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import useAddAccountAnalytics from "LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { getAccountUrl } from "~/renderer/utils/accountUrl";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { MAD_SOURCE_PAGES } from "LLD/features/ModularDialog/analytics/modularDialog.types";
import useCryptoAddressesViewModel from "../useCryptoAddressesViewModel";
import { useCryptoAccountRows } from "../../components/Table/hooks/useCryptoAccountRows";
import { CRYPTO_TRACKING_PAGE_NAME } from "../../constants";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

const mockTrack = jest.fn();
jest.mock("~/renderer/analytics/segment", () => ({
  track: (event: string, props?: Record<string, unknown>) => mockTrack(event, props),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockOpenAssetFlow = jest.fn();
const mockTrackAddAccountEvent = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: jest.fn(),
}));

jest.mock("LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("~/renderer/analytics/TrackPage", () => ({
  setTrackingSource: jest.fn(),
}));

jest.mock("../../components/Table/hooks/useCryptoAccountRows", () => ({
  useCryptoAccountRows: jest.fn(),
}));

const mockUseOpenAssetFlow = jest.mocked(useOpenAssetFlow);
const mockUseAddAccountAnalytics = jest.mocked(useAddAccountAnalytics);
const mockUseCryptoAccountRows = jest.mocked(useCryptoAccountRows);
const mockSetTrackingSource = jest.mocked(setTrackingSource);

describe("useCryptoAddressesViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenAssetFlow.mockReturnValue({
      openAssetFlow: mockOpenAssetFlow,
      openAddAccountFlow: jest.fn(),
    });
    mockUseAddAccountAnalytics.mockReturnValue({
      trackAddAccountEvent: mockTrackAddAccountEvent,
    });
    mockUseCryptoAccountRows.mockReturnValue({
      rows: [],
      lookupParentAccount: jest.fn(),
    });
  });

  it("should track button_clicked and call openAssetFlow on onAddAddressClick", () => {
    const { result } = renderHook(() => useCryptoAddressesViewModel());

    act(() => {
      result.current.onAddAddressClick();
    });

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "add_account",
      page: CRYPTO_TRACKING_PAGE_NAME,
    });
    expect(mockOpenAssetFlow).toHaveBeenCalledTimes(1);
    expect(mockUseOpenAssetFlow).toHaveBeenCalledWith(
      { location: ModularDrawerLocation.ADD_ACCOUNT },
      MAD_SOURCE_PAGES.CRYPTOS_PAGE,
    );
  });

  it("should navigate to account URL when a main account row is clicked", () => {
    const { result } = renderHook(() => useCryptoAddressesViewModel());
    act(() => {
      result.current.onAccountClick(ETH_ACCOUNT);
    });

    expect(mockSetTrackingSource).toHaveBeenCalledWith("Addresses");
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(getAccountUrl(ETH_ACCOUNT.id));
  });

  it("should navigate to token account URL when a token row is clicked with parent", () => {
    const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

    const { result } = renderHook(() => useCryptoAddressesViewModel());

    act(() => {
      result.current.onAccountClick(tokenAccount, ETH_ACCOUNT);
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(getAccountUrl(tokenAccount.id, ETH_ACCOUNT.id));
  });

  it("should navigate to /accounts when token has no parent and asset section is off", () => {
    const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

    const { result } = renderHook(() => useCryptoAddressesViewModel());

    act(() => {
      result.current.onAccountClick(tokenAccount, undefined);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/accounts");
  });

  it("should navigate to /cryptos when token has no parent and asset section is on", () => {
    const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

    const { result } = renderHook(() => useCryptoAddressesViewModel(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lwdWallet40: { enabled: true, params: { assetSection: true } },
          },
        },
      },
    });

    act(() => {
      result.current.onAccountClick(tokenAccount, undefined);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/cryptos");
  });

  it("should update searchValue and track search_query when setSearchValue is called", () => {
    const { result } = renderHook(() => useCryptoAddressesViewModel());

    act(() => {
      result.current.setSearchValue("eth");
    });

    expect(result.current.searchValue).toBe("eth");
    expect(mockUseCryptoAccountRows).toHaveBeenLastCalledWith("eth");
    expect(mockTrack).toHaveBeenCalledWith("search_query", {
      query: "eth",
      page: CRYPTO_TRACKING_PAGE_NAME,
    });
  });

  it("should expose empty table message for no search query", () => {
    const { result } = renderHook(() => useCryptoAddressesViewModel());

    expect(result.current.emptyTableMessage).toBe("No crypto address yet");
  });

  it("should expose empty search table message when search is non-empty", () => {
    const { result } = renderHook(() => useCryptoAddressesViewModel());

    act(() => {
      result.current.setSearchValue("btc");
    });

    expect(result.current.emptyTableMessage).toBe("No accounts match your search");
  });

  it("should treat whitespace-only search as empty for empty table message", () => {
    const { result } = renderHook(() => useCryptoAddressesViewModel());

    act(() => {
      result.current.setSearchValue("   ");
    });

    expect(result.current.emptyTableMessage).toBe("No crypto address yet");
  });
});
