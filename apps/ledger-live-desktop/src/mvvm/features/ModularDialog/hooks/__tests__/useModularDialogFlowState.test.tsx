import { act, renderHook } from "tests/testSetup";
import {
  arbitrumCurrency,
  bitcoinCurrency,
  ethereumCurrency,
} from "../../../__mocks__/useSelectAssetFlow.mock";
import { useModularDialogFlowState } from "../useModularDialogFlowState";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockIsAcceptedCurrency,
}));

const mockIsAcceptedCurrency = jest.fn((_currency: CryptoOrTokenCurrency) => true);

const mockGoToStep = jest.fn();
const mockSetNetworksToDisplay = jest.fn();
const mockOnAssetSelected = jest.fn();
const mockOnAccountSelected = jest.fn();

const defaultProps = {
  assets: [],
  loadingStatus: LoadingStatus.Success,
  setNetworksToDisplay: mockSetNetworksToDisplay,
  goToStep: mockGoToStep,
};

const assetsWithNetworks: AssetData[] = [
  {
    asset: {
      id: ethereumCurrency.id,
      ticker: ethereumCurrency.ticker,
      name: ethereumCurrency.name,
      assetsIds: {
        [ethereumCurrency.id]: ethereumCurrency.id,
        [arbitrumCurrency.id]: arbitrumCurrency.id,
      },
    },
    networks: [ethereumCurrency, arbitrumCurrency],
  },
  {
    asset: {
      id: bitcoinCurrency.id,
      ticker: bitcoinCurrency.ticker,
      name: bitcoinCurrency.name,
      assetsIds: { [bitcoinCurrency.id]: bitcoinCurrency.id },
    },
    networks: [bitcoinCurrency],
  },
];

describe("useModularDialogFlowState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAcceptedCurrency.mockImplementation(() => true);
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useModularDialogFlowState(defaultProps));
    expect(result.current.selectedAsset).toBeUndefined();
    expect(result.current.selectedNetwork).toBeUndefined();
    expect(result.current.providers).toBeUndefined();
  });

  it("should handle asset selection", () => {
    const { result } = renderHook(() => useModularDialogFlowState(defaultProps), {
      initialState: {
        modularDialog: { isOpen: true, dialogParams: { onAssetSelected: mockOnAssetSelected } },
      },
    });
    act(() => {
      result.current.handleAssetSelected(ethereumCurrency);
    });
    expect(mockOnAssetSelected).toHaveBeenCalledWith(ethereumCurrency);
  });

  it("should go back to asset selection", () => {
    const { result } = renderHook(() => useModularDialogFlowState(defaultProps));
    act(() => {
      result.current.goBackToAssetSelection();
    });
    expect(mockGoToStep).toHaveBeenCalledWith("ASSET_SELECTION");
    expect(result.current.selectedAsset).toBeUndefined();
    expect(result.current.selectedNetwork).toBeUndefined();
  });

  it("should go to network selection", () => {
    const { result } = renderHook(() => useModularDialogFlowState(defaultProps));
    const filtered = [bitcoinCurrency];
    act(() => {
      result.current.goToNetworkSelection(bitcoinCurrency, filtered);
    });
    expect(mockSetNetworksToDisplay).toHaveBeenCalledWith(filtered);
    expect(mockGoToStep).toHaveBeenCalledWith("NETWORK_SELECTION");
  });

  const scopedCurrencyState = (currencyId: string) => ({
    initialState: {
      modularDialog: {
        isOpen: true,
        dialogParams: {
          currencies: [currencyId],
          areCurrenciesFiltered: true,
          onAccountSelected: mockOnAccountSelected,
        },
      },
    },
  });

  it.each(["cronos", "coreum", "assethub_polkadot"])(
    "should select the account of the scoped %s currency when the catalog has no asset for it",
    currencyId => {
      const { result } = renderHook(
        () => useModularDialogFlowState({ ...defaultProps, assets: [] }),
        scopedCurrencyState(currencyId),
      );

      expect(result.current.selectedAsset?.id).toBe(currencyId);
      expect(result.current.selectedNetwork?.id).toBe(currencyId);
      expect(mockGoToStep).toHaveBeenCalledWith("ACCOUNT_SELECTION");
    },
  );

  it("should expose no skip target while the catalog request is still in flight", () => {
    const { result } = renderHook(
      () =>
        useModularDialogFlowState({
          ...defaultProps,
          assets: undefined,
          loadingStatus: LoadingStatus.Pending,
        }),
      scopedCurrencyState("cronos"),
    );

    expect(result.current.accountAutoSkipState).toBe("loading");
    expect(result.current.selectedAsset).toBeUndefined();
    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("should expose no skip target for a currency the flow does not accept", () => {
    mockIsAcceptedCurrency.mockImplementation(currency => currency.id !== "coreum");

    const { result } = renderHook(
      () => useModularDialogFlowState({ ...defaultProps, assets: [] }),
      scopedCurrencyState("coreum"),
    );

    expect(result.current.accountAutoSkipState).toBe("unavailable");
    expect(result.current.selectedAsset).toBeUndefined();
    expect(mockGoToStep).not.toHaveBeenCalledWith("ACCOUNT_SELECTION");
  });

  it("should expose no skip target when the single catalog asset has no acceptable network", () => {
    mockIsAcceptedCurrency.mockImplementation(currency => currency.id !== bitcoinCurrency.id);

    const { result } = renderHook(
      () => useModularDialogFlowState({ ...defaultProps, assets: [assetsWithNetworks[1]] }),
      scopedCurrencyState(bitcoinCurrency.id),
    );

    expect(result.current.accountAutoSkipState).toBe("unavailable");
    expect(mockGoToStep).not.toHaveBeenCalledWith("ACCOUNT_SELECTION");
  });

  it("should skip to the account step when the single catalog asset is selectable", () => {
    const { result } = renderHook(
      () => useModularDialogFlowState({ ...defaultProps, assets: [assetsWithNetworks[1]] }),
      scopedCurrencyState(bitcoinCurrency.id),
    );

    expect(result.current.selectedAsset?.id).toBe(bitcoinCurrency.id);
    expect(mockGoToStep).toHaveBeenCalledWith("ACCOUNT_SELECTION");
  });

  it("should reject ineligible selections while allowing an eligible network", () => {
    const { result } = renderHook(
      () =>
        useModularDialogFlowState({
          ...defaultProps,
          assets: assetsWithNetworks,
        }),
      {
        initialState: {
          modularDialog: {
            isOpen: true,
            dialogParams: {
              onAssetSelected: mockOnAssetSelected,
              selectableNetworkIds: [ethereumCurrency.id],
            },
          },
        },
      },
    );

    act(() => result.current.handleAssetSelected(bitcoinCurrency));
    expect(mockOnAssetSelected).not.toHaveBeenCalled();
    expect(mockGoToStep).not.toHaveBeenCalled();

    act(() => result.current.handleAssetSelected(ethereumCurrency));
    expect(mockSetNetworksToDisplay).toHaveBeenCalledWith([ethereumCurrency, arbitrumCurrency]);
    expect(mockGoToStep).toHaveBeenCalledWith("NETWORK_SELECTION");

    act(() => result.current.handleNetworkSelected(arbitrumCurrency));
    expect(mockOnAssetSelected).not.toHaveBeenCalled();

    act(() => result.current.handleNetworkSelected(ethereumCurrency));
    expect(mockOnAssetSelected).toHaveBeenCalledWith(ethereumCurrency);
  });
});
