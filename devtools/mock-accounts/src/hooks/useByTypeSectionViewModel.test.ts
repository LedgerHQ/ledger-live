import { renderHook, act } from "@testing-library/react";
import { useByTypeSectionViewModel } from "./useByTypeSectionViewModel";

describe("useByTypeSectionViewModel", () => {
  const makeOpts = (overrides = {}) => ({
    onGenerate: jest.fn(),
    stocksLoading: false,
    stablecoinsLoading: false,
    ...overrides,
  });

  it("starts with all types enabled, testnet off, count 10", () => {
    const { result } = renderHook(() => useByTypeSectionViewModel(makeOpts()));
    expect(result.current.includeCryptos).toBe(true);
    expect(result.current.includeStablecoins).toBe(true);
    expect(result.current.includeStocks).toBe(true);
    expect(result.current.includeTestnet).toBe(false);
    expect(result.current.countInput).toBe("10");
    expect(result.current.isValid).toBe(true);
    expect(result.current.isReady).toBe(true);
  });

  it("isValid is false when all types are disabled", () => {
    const { result } = renderHook(() => useByTypeSectionViewModel(makeOpts()));
    act(() => {
      result.current.onToggleCryptos(false);
      result.current.setIncludeStablecoins(false);
      result.current.setIncludeStocks(false);
    });
    expect(result.current.isValid).toBe(false);
    expect(result.current.isReady).toBe(false);
  });

  it("isReady is false when stablecoins are included and loading", () => {
    const { result } = renderHook(() =>
      useByTypeSectionViewModel(makeOpts({ stablecoinsLoading: true })),
    );
    expect(result.current.isReady).toBe(false);
  });

  it("isReady is false when stocks are included and loading", () => {
    const { result } = renderHook(() =>
      useByTypeSectionViewModel(makeOpts({ stocksLoading: true })),
    );
    expect(result.current.isReady).toBe(false);
  });

  it("isReady is true when stablecoins loading but not included", () => {
    const { result } = renderHook(() =>
      useByTypeSectionViewModel(makeOpts({ stablecoinsLoading: true })),
    );
    act(() => result.current.setIncludeStablecoins(false));
    expect(result.current.isReady).toBe(true);
  });

  it("onToggleCryptos(false) also clears includeTestnet", () => {
    const { result } = renderHook(() => useByTypeSectionViewModel(makeOpts()));
    act(() => result.current.onToggleTestnet(true));
    act(() => result.current.onToggleCryptos(false));
    expect(result.current.includeCryptos).toBe(false);
    expect(result.current.includeTestnet).toBe(false);
  });

  it("onToggleTestnet(true) also enables includeCryptos", () => {
    const { result } = renderHook(() => useByTypeSectionViewModel(makeOpts()));
    act(() => result.current.onToggleCryptos(false));
    expect(result.current.includeCryptos).toBe(false);
    act(() => result.current.onToggleTestnet(true));
    expect(result.current.includeCryptos).toBe(true);
    expect(result.current.includeTestnet).toBe(true);
  });

  it("onGenerate calls callback with current option values", () => {
    const onGenerate = jest.fn();
    const { result } = renderHook(() => useByTypeSectionViewModel(makeOpts({ onGenerate })));
    act(() => {
      result.current.setIncludeStocks(false);
      result.current.setCountInput("5");
    });
    act(() => result.current.onGenerate());
    expect(onGenerate).toHaveBeenCalledWith({
      includeCryptos: true,
      includeStablecoins: true,
      includeStocks: false,
      includeTestnet: false,
      count: 5,
    });
  });

  it("onGenerate falls back to count 10 when countInput is not a number", () => {
    const onGenerate = jest.fn();
    const { result } = renderHook(() => useByTypeSectionViewModel(makeOpts({ onGenerate })));
    act(() => result.current.setCountInput("abc"));
    act(() => result.current.onGenerate());
    expect(onGenerate).toHaveBeenCalledWith(expect.objectContaining({ count: 10 }));
  });
});
