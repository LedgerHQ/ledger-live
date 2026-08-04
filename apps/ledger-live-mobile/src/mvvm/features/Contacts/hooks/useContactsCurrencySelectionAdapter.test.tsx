import { act, renderHook } from "@tests/test-renderer";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { ScreenName } from "~/const";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { useContactsCurrencySelectionAdapter } from "./useContactsCurrencySelectionAdapter";

const mockOpenDrawer = jest.fn();

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: jest.fn(),
}));

const mockedUseModularDrawerController = jest.mocked(useModularDrawerController);

describe("useContactsCurrencySelectionAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseModularDrawerController.mockReturnValue({
      openDrawer: mockOpenDrawer,
    } as unknown as ReturnType<typeof useModularDrawerController>);
  });

  it("opens MAD in currency mode with the exact eligible network ids", () => {
    const { result } = renderHook(() => useContactsCurrencySelectionAdapter());

    void result.current.selectCurrency([mockEthCryptoCurrency.id, mockBtcCryptoCurrency.id]);

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        currencies: [mockEthCryptoCurrency.id, mockBtcCryptoCurrency.id],
        areCurrenciesFiltered: true,
        completionMode: "currency",
        enableAccountSelection: false,
        flow: "contacts_add_address",
        source: ScreenName.MyWalletContactDetail,
      }),
    );
  });

  it("returns only the selected currency id", async () => {
    const { result } = renderHook(() => useContactsCurrencySelectionAdapter());
    const selection = result.current.selectCurrency([mockEthCryptoCurrency.id]);
    const onCurrencySelected = mockOpenDrawer.mock.calls[0][0].onCurrencySelected;

    await act(async () => onCurrencySelected?.(mockEthCryptoCurrency));

    await expect(selection).resolves.toBe(mockEthCryptoCurrency.id);
  });

  it("returns null on cancellation or an invalid MAD result", async () => {
    const { result } = renderHook(() => useContactsCurrencySelectionAdapter());
    const cancelledSelection = result.current.selectCurrency([mockEthCryptoCurrency.id]);
    const cancel = mockOpenDrawer.mock.calls[0][0].onCurrencySelected;

    await act(async () => cancel?.(null));
    await expect(cancelledSelection).resolves.toBeNull();

    const invalidSelection = result.current.selectCurrency([mockEthCryptoCurrency.id]);
    const selectInvalidCurrency = mockOpenDrawer.mock.calls[1][0].onCurrencySelected;

    await act(async () =>
      selectInvalidCurrency?.({
        ...mockEthCryptoCurrency,
        id: "",
      } as typeof mockEthCryptoCurrency),
    );
    await expect(invalidSelection).resolves.toBeNull();
  });
});
