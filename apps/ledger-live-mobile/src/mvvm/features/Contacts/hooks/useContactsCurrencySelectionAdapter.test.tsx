import { act, renderHook } from "@tests/test-renderer";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { track } from "~/analytics/segment";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { useContactsCurrencySelectionAdapter } from "./useContactsCurrencySelectionAdapter";

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: jest.fn(),
}));
jest.mock("~/analytics/segment", () => ({ track: jest.fn() }));

const openDrawer = jest.fn();
const closeDrawer = jest.fn();
const hideDrawer = jest.fn();
const handleAccountSelected = jest.fn();
const handleCurrencySelected = jest.fn();
const mockedUseModularDrawerController = jest.mocked(useModularDrawerController);

function mockModularDrawerController(
  overrides: Partial<ReturnType<typeof useModularDrawerController>> = {},
) {
  mockedUseModularDrawerController.mockReturnValue({
    areCurrenciesFiltered: undefined,
    assetsConfiguration: undefined,
    categories: undefined,
    closeDrawer,
    hideDrawer,
    completionMode: "currency",
    enableAccountSelection: false,
    handleAccountSelected,
    handleCurrencySelected,
    isOpen: true,
    networksConfiguration: undefined,
    openDrawer,
    presentation: "embedded",
    preselectedCurrencies: [mockEthCryptoCurrency.id, mockBtcCryptoCurrency.id],
    selectableNetworkIds: undefined,
    uiUseCase: undefined,
    useCase: undefined,
    ...overrides,
  });
}

describe("useContactsCurrencySelectionAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModularDrawerController();
  });

  it("should open the existing MAD in embedded currency mode", () => {
    const networkIds = [mockEthCryptoCurrency.id, mockBtcCryptoCurrency.id];

    renderHook(() =>
      useContactsCurrencySelectionAdapter({
        isOpen: true,
        networkIds,
        onCurrencySelected: jest.fn(),
        onSelectionCancelled: jest.fn(),
      }),
    );

    expect(openDrawer).toHaveBeenCalledWith({
      assetsConfiguration: {
        leftElement: "undefined",
        rightElement: "undefined",
      },
      completionMode: "currency",
      enableAccountSelection: false,
      flow: "contacts",
      networksConfiguration: {
        leftElement: "undefined",
        rightElement: "undefined",
      },
      presentation: "embedded",
      source: "contacts",
      selectableNetworkIds: networkIds,
      onCurrencySelected: expect.any(Function),
    });
  });

  it("should return the selected currency id and display name", () => {
    const onCurrencySelected = jest.fn();
    renderHook(() =>
      useContactsCurrencySelectionAdapter({
        isOpen: true,
        networkIds: [mockEthCryptoCurrency.id],
        onCurrencySelected,
        onSelectionCancelled: jest.fn(),
      }),
    );

    const onMadCurrencySelected = openDrawer.mock.calls[0]?.[0].onCurrencySelected;
    act(() => onMadCurrencySelected(mockEthCryptoCurrency));

    expect(onCurrencySelected).toHaveBeenCalledWith({
      currencyId: mockEthCryptoCurrency.id,
      assetDisplayName: mockEthCryptoCurrency.name,
    });
  });

  it.each([null, { ...mockEthCryptoCurrency, id: "" }])(
    "should cancel when MAD does not return a valid currency",
    currency => {
      const onSelectionCancelled = jest.fn();
      renderHook(() =>
        useContactsCurrencySelectionAdapter({
          isOpen: true,
          networkIds: [mockEthCryptoCurrency.id],
          onCurrencySelected: jest.fn(),
          onSelectionCancelled,
        }),
      );

      const onMadCurrencySelected = openDrawer.mock.calls[0]?.[0].onCurrencySelected;
      act(() => onMadCurrencySelected(currency));

      expect(onSelectionCancelled).toHaveBeenCalledTimes(1);
    },
  );

  it("should expose the controller wiring to ModularDrawerFlow", () => {
    const { result } = renderHook(() =>
      useContactsCurrencySelectionAdapter({
        isOpen: true,
        networkIds: [mockEthCryptoCurrency.id],
        onCurrencySelected: jest.fn(),
        onSelectionCancelled: jest.fn(),
      }),
    );

    expect(result.current.flowProps).toMatchObject({
      areCurrenciesFiltered: undefined,
      assetsConfiguration: {
        leftElement: "undefined",
        rightElement: "undefined",
      },
      currencies: [mockEthCryptoCurrency.id, mockBtcCryptoCurrency.id],
      isOpen: true,
      networksConfiguration: {
        leftElement: "undefined",
        rightElement: "undefined",
      },
      onAccountSelected: handleAccountSelected,
      onClose: closeDrawer,
      onCurrencySelected: handleCurrencySelected,
      selectableNetworkIds: [mockEthCryptoCurrency.id],
    });
  });

  it("should track clicks on disabled-item explanations", () => {
    const { result } = renderHook(() =>
      useContactsCurrencySelectionAdapter({
        isOpen: true,
        networkIds: [mockEthCryptoCurrency.id],
        onCurrencySelected: jest.fn(),
        onSelectionCancelled: jest.fn(),
      }),
    );
    const networkExplanation = result.current.flowProps.disabledItemsExplanation?.network(
      "Bitcoin",
      "BTC",
    );
    const assetExplanation = result.current.flowProps.disabledItemsExplanation?.asset("Bitcoin");

    act(() => {
      if (networkExplanation) {
        result.current.flowProps.disabledItemsExplanation?.onPress(networkExplanation);
      }
      if (assetExplanation) {
        result.current.flowProps.disabledItemsExplanation?.onPress(assetExplanation);
      }
    });

    expect(track).toHaveBeenNthCalledWith(1, "button_clicked", {
      button: "disabled network tooltip",
      flow: "contacts",
      asset: "BTC",
      network: "Bitcoin",
      page: "Network Selection",
      source: "contacts",
    });
    expect(track).toHaveBeenNthCalledWith(2, "button_clicked", {
      button: "disabled network tooltip",
      flow: "contacts",
      asset: "Bitcoin",
      page: "Asset Selection",
      source: "contacts",
    });
  });

  it("should not open MAD outside the currency selection step", () => {
    renderHook(() =>
      useContactsCurrencySelectionAdapter({
        isOpen: false,
        networkIds: [mockEthCryptoCurrency.id],
        onCurrencySelected: jest.fn(),
        onSelectionCancelled: jest.fn(),
      }),
    );

    expect(openDrawer).not.toHaveBeenCalled();
  });

  it("should open MAD only once per currency selection session", () => {
    let isOpen = true;
    const { rerender } = renderHook(() =>
      useContactsCurrencySelectionAdapter({
        isOpen,
        networkIds: [mockEthCryptoCurrency.id],
        onCurrencySelected: jest.fn(),
        onSelectionCancelled: jest.fn(),
      }),
    );

    rerender(undefined);
    expect(openDrawer).toHaveBeenCalledTimes(1);

    isOpen = false;
    rerender(undefined);
    isOpen = true;
    rerender(undefined);

    expect(openDrawer).toHaveBeenCalledTimes(2);
  });

  it("should close MAD when unmounted during currency selection", () => {
    const { unmount } = renderHook(() =>
      useContactsCurrencySelectionAdapter({
        isOpen: true,
        networkIds: [mockEthCryptoCurrency.id],
        onCurrencySelected: jest.fn(),
        onSelectionCancelled: jest.fn(),
      }),
    );

    unmount();

    expect(closeDrawer).toHaveBeenCalledTimes(1);
  });

  it("should use the latest close handler without closing MAD during a rerender", () => {
    const updatedCloseDrawer = jest.fn();
    const { rerender, unmount } = renderHook(() =>
      useContactsCurrencySelectionAdapter({
        isOpen: true,
        networkIds: [mockEthCryptoCurrency.id],
        onCurrencySelected: jest.fn(),
        onSelectionCancelled: jest.fn(),
      }),
    );

    mockModularDrawerController({ closeDrawer: updatedCloseDrawer });
    rerender(undefined);

    expect(closeDrawer).not.toHaveBeenCalled();
    expect(updatedCloseDrawer).not.toHaveBeenCalled();

    unmount();

    expect(updatedCloseDrawer).toHaveBeenCalledTimes(1);
  });
});
