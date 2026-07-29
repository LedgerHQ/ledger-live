import { act, renderHook } from "@tests/test-renderer";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { ScreenName } from "~/const";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { useContactsCurrencySelectionAdapter } from "./useContactsCurrencySelectionAdapter";

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: jest.fn(),
}));

const openDrawer = jest.fn();
const closeDrawer = jest.fn();
const handleAccountSelected = jest.fn();
const handleCurrencySelected = jest.fn();
const mockedUseModularDrawerController = jest.mocked(useModularDrawerController);

describe("useContactsCurrencySelectionAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseModularDrawerController.mockReturnValue({
      areCurrenciesFiltered: true,
      assetsConfiguration: undefined,
      closeDrawer,
      completionMode: "currency",
      enableAccountSelection: false,
      handleAccountSelected,
      handleCurrencySelected,
      isOpen: true,
      networksConfiguration: undefined,
      openDrawer,
      presentation: "embedded",
      preselectedCurrencies: [mockEthCryptoCurrency.id, mockBtcCryptoCurrency.id],
      uiUseCase: undefined,
      useCase: undefined,
    });
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
      currencies: networkIds,
      areCurrenciesFiltered: true,
      completionMode: "currency",
      enableAccountSelection: false,
      flow: "contacts_add_address",
      presentation: "embedded",
      source: ScreenName.MyWalletContactDetail,
      onCurrencySelected: expect.any(Function),
    });
  });

  it("should return a valid selected currency id", () => {
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

    expect(onCurrencySelected).toHaveBeenCalledWith(mockEthCryptoCurrency.id);
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
      areCurrenciesFiltered: true,
      currencies: [mockEthCryptoCurrency.id, mockBtcCryptoCurrency.id],
      isOpen: true,
      onAccountSelected: handleAccountSelected,
      onClose: closeDrawer,
      onCurrencySelected: handleCurrencySelected,
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
});
