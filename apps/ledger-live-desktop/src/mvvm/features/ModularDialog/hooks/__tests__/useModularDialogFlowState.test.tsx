import { act, renderHook } from "tests/testSetup";
import { bitcoinCurrency, ethereumCurrency } from "../../../__mocks__/useSelectAssetFlow.mock";
import { useModularDialogFlowState } from "../useModularDialogFlowState";

const mockGoToStep = jest.fn();
const mockSetNetworksToDisplay = jest.fn();
const mockOnAssetSelected = jest.fn();

const defaultProps = {
  assets: [],
  sortedCryptoCurrencies: [bitcoinCurrency, ethereumCurrency],
  setNetworksToDisplay: mockSetNetworksToDisplay,
  goToStep: mockGoToStep,
};

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
        modularDrawer: { isOpen: true, dialogParams: { onAssetSelected: mockOnAssetSelected } },
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
});
