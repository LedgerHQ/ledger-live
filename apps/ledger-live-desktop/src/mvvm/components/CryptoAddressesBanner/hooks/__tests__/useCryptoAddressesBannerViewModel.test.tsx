import { renderHook, act } from "tests/testSetup";
import { useCryptoAddressesBannerViewModel } from "../useCryptoAddressesBannerViewModel";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { Wallet } from "@ledgerhq/lumen-ui-react/symbols";

const mockOpenAssetFlow = jest.fn();

jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: jest.fn(),
}));

const mockUseOpenAssetFlow = jest.mocked(useOpenAssetFlow);

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

    expect(result.current.title).toBe("Crypto addresses");
    expect(result.current.description).toBe("No addresses yet");
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

  it("should call useOpenAssetFlow with ADD_ACCOUNT location and correct source", () => {
    renderHook(() => useCryptoAddressesBannerViewModel());

    expect(mockUseOpenAssetFlow).toHaveBeenCalledWith(
      { location: ModularDrawerLocation.ADD_ACCOUNT },
      "portfolio_crypto_addresses_banner",
    );
  });
});
