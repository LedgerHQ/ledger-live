import { renderHook, act } from "tests/testSetup";
import { useCryptoAddressesBannerViewModel } from "../useCryptoAddressesBannerViewModel";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import {
  ARB_ACCOUNT,
  BTC_ACCOUNT,
  EMPTY_BTC_ACCOUNT,
  ETH_ACCOUNT,
  SOL_ACCOUNT,
} from "LLD/features/__mocks__/accounts.mock";
import { track } from "~/renderer/analytics/segment";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";

const mockOpenAssetFlow = jest.fn();
const mockNavigate = jest.fn();

jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: jest.fn(),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockUseOpenAssetFlow = jest.mocked(useOpenAssetFlow);
const mockTrack = jest.mocked(track);

describe("useCryptoAddressesBannerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenAssetFlow.mockReturnValue({
      openAssetFlow: mockOpenAssetFlow,
      openAddAccountFlow: jest.fn(),
    });
  });

  it("should return title, description, icon, onGoToAccounts and onAddAccount", () => {
    const { result } = renderHook(() => useCryptoAddressesBannerViewModel());

    expect(result.current.title).toBe("Crypto accounts");
    expect(result.current.description).toBe("No accounts yet");
    expect(result.current.icon).toBe(Wallet);
    expect(result.current.onGoToAccounts).toBeDefined();
    expect(typeof result.current.onGoToAccounts).toBe("function");
    expect(result.current.onAddAccount).toBeDefined();
    expect(typeof result.current.onAddAccount).toBe("function");
  });

  it("should call openAssetFlow when onAddAccount is invoked", () => {
    const { result } = renderHook(() => useCryptoAddressesBannerViewModel());

    act(() => {
      result.current.onAddAccount();
    });

    expect(mockOpenAssetFlow).toHaveBeenCalledTimes(1);
  });

  it("should track button_clicked and navigate to /accounts when onGoToAccounts is invoked and asset section is off", () => {
    const { result } = renderHook(() => useCryptoAddressesBannerViewModel());

    act(() => {
      result.current.onGoToAccounts();
    });

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "accounts",
      page: PORTFOLIO_TRACKING_PAGE_NAME,
    });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/accounts");
  });

  it("should navigate to /cryptos when onGoToAccounts is invoked and asset section is on", () => {
    const { result } = renderHook(() => useCryptoAddressesBannerViewModel(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            lwdWallet40: { enabled: true, params: { assetSection: true } },
          },
        },
      },
    });

    act(() => {
      result.current.onGoToAccounts();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/cryptos");
  });

  it("should call useOpenAssetFlow with ADD_ACCOUNT location and correct source", () => {
    renderHook(() => useCryptoAddressesBannerViewModel());

    expect(mockUseOpenAssetFlow).toHaveBeenCalledWith(
      { location: ModularDrawerLocation.ADD_ACCOUNT },
      "portfolio_crypto_addresses_banner",
    );
  });

  describe("firstThreeCurrencies", () => {
    it("should return empty array when there are no accounts", () => {
      const { result } = renderHook(() => useCryptoAddressesBannerViewModel());

      expect(result.current.firstThreeCurrencies).toEqual([]);
    });

    it("should return unique currencies only (deduplicate by currency id)", () => {
      const initialState = {
        accounts: [BTC_ACCOUNT, EMPTY_BTC_ACCOUNT],
      };
      const { result } = renderHook(() => useCryptoAddressesBannerViewModel(), {
        initialState,
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(1);
      expect(result.current.firstThreeCurrencies[0].id).toBe("bitcoin");
    });

    it("should return up to 3 unique currencies in order of first appearance", () => {
      const initialState = {
        accounts: [BTC_ACCOUNT, ETH_ACCOUNT, SOL_ACCOUNT],
      };
      const { result } = renderHook(() => useCryptoAddressesBannerViewModel(), {
        initialState,
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(3);
      expect(result.current.firstThreeCurrencies.map(c => c.id)).toEqual([
        "bitcoin",
        "ethereum",
        "solana",
      ]);
    });

    it("should cap at 3 unique currencies when there are more", () => {
      const initialState = {
        accounts: [BTC_ACCOUNT, ETH_ACCOUNT, SOL_ACCOUNT, ARB_ACCOUNT],
      };
      const { result } = renderHook(() => useCryptoAddressesBannerViewModel(), {
        initialState,
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(3);
      expect(result.current.firstThreeCurrencies.map(c => c.id)).toEqual([
        "bitcoin",
        "ethereum",
        "solana",
      ]);
    });
  });
});
