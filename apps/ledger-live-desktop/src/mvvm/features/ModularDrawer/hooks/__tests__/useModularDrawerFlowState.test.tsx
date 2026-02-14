import { act, renderHook } from "tests/testSetup";
import { bitcoinCurrency, ethereumCurrency } from "../../../__mocks__/useSelectAssetFlow.mock";
import { useModularDrawerFlowState } from "../useModularDrawerFlowState";

const mockGoToStep = jest.fn();
const mockSetNetworksToDisplay = jest.fn();
const mockOnAssetSelected = jest.fn();
const mockOnAccountSelected = jest.fn();

const defaultProps = {
  assets: [],
  assetsToDisplay: [ethereumCurrency, bitcoinCurrency],
  sortedCryptoCurrencies: [bitcoinCurrency, ethereumCurrency],
  setNetworksToDisplay: mockSetNetworksToDisplay,
  currencyIds: ["bitcoin", "ethereum"],
  goToStep: mockGoToStep,
  isSelectAccountFlow: false,
  onAssetSelected: mockOnAssetSelected,
  onAccountSelected: mockOnAccountSelected,
  hasOneNetwork: false,
  hasOneCurrency: false,
  flow: "selectAsset",
};

describe("useModularDrawerFlowState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useModularDrawerFlowState(defaultProps));
    expect(result.current.selectedAsset).toBeUndefined();
    expect(result.current.selectedNetwork).toBeUndefined();
    expect(result.current.providers).toBeUndefined();
  });

  it("should handle asset selection", () => {
    const { result } = renderHook(() => useModularDrawerFlowState(defaultProps));
    act(() => {
      result.current.handleAssetSelected(defaultProps.assetsToDisplay[0]);
    });
    expect(mockOnAssetSelected).toHaveBeenCalledWith(defaultProps.assetsToDisplay[0]);
  });

  it("should go back to asset selection", () => {
    const { result } = renderHook(() => useModularDrawerFlowState(defaultProps));
    act(() => {
      result.current.goBackToAssetSelection();
    });
    expect(mockGoToStep).toHaveBeenCalledWith("ASSET_SELECTION");
    expect(result.current.selectedAsset).toBeUndefined();
    expect(result.current.selectedNetwork).toBeUndefined();
  });

  it("should go to network selection", () => {
    const { result } = renderHook(() => useModularDrawerFlowState(defaultProps));
    const filtered = [bitcoinCurrency];
    act(() => {
      result.current.goToNetworkSelection(bitcoinCurrency, filtered);
    });
    expect(mockSetNetworksToDisplay).toHaveBeenCalledWith(filtered);
    expect(mockGoToStep).toHaveBeenCalledWith("NETWORK_SELECTION");
  });
});
