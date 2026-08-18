import { act, renderHook } from "tests/testSetup";
import {
  arbitrumCurrency,
  bitcoinCurrency,
  ethereumCurrency,
} from "../../../__mocks__/useSelectAssetFlow.mock";
import { useModularDialogFlowState } from "../useModularDialogFlowState";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => () => true,
}));

const mockGoToStep = jest.fn();
const mockSetNetworksToDisplay = jest.fn();
const mockOnAssetSelected = jest.fn();

const defaultProps = {
  assets: [],
  sortedCryptoCurrencies: [bitcoinCurrency, ethereumCurrency],
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
