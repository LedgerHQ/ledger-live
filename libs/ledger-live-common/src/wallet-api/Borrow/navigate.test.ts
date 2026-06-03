import { createBorrowNavigateHandler } from "./navigate";
import type { BorrowSwapNavigationParams } from "./types";

describe("createBorrowNavigateHandler", () => {
  const buildHooks = () => ({
    onGoBack: jest.fn(),
    onGoToSwap: jest.fn(),
  });

  it("invokes onGoBack and resolves successfully for the 'go-back' action", async () => {
    const hooks = buildHooks();
    const handler = createBorrowNavigateHandler(hooks);

    await expect(handler({ params: { action: "go-back" } })).resolves.toEqual({
      success: true,
    });

    expect(hooks.onGoBack).toHaveBeenCalledTimes(1);
    expect(hooks.onGoToSwap).not.toHaveBeenCalled();
  });

  it("forwards all swap params to onGoToSwap for the 'go-to-swap' action", async () => {
    const hooks = buildHooks();
    const handler = createBorrowNavigateHandler(hooks);

    const swapParams: BorrowSwapNavigationParams = {
      fromCurrencyId: "ethereum",
      toCurrencyId: "bitcoin",
      fromTokenId: "ethereum/erc20/usd_tether__erc20_",
      toTokenId: "bitcoin/erc20/wrapped_bitcoin",
      fromAccountId: "from-account",
      toAccountId: "to-account",
      amountFrom: "1.5",
      affiliate: "borrow-app",
    };

    await expect(
      handler({ params: { action: "go-to-swap", ...swapParams } }),
    ).resolves.toEqual({ success: true });

    expect(hooks.onGoToSwap).toHaveBeenCalledTimes(1);
    expect(hooks.onGoToSwap).toHaveBeenCalledWith(swapParams);
    expect(hooks.onGoBack).not.toHaveBeenCalled();
  });

  it("calls onGoToSwap with undefined fields when the request has no swap params", async () => {
    const hooks = buildHooks();
    const handler = createBorrowNavigateHandler(hooks);

    await expect(handler({ params: { action: "go-to-swap" } })).resolves.toEqual({
      success: true,
    });

    expect(hooks.onGoToSwap).toHaveBeenCalledWith({
      fromCurrencyId: undefined,
      toCurrencyId: undefined,
      fromTokenId: undefined,
      toTokenId: undefined,
      fromAccountId: undefined,
      toAccountId: undefined,
      amountFrom: undefined,
      affiliate: undefined,
    });
  });

  it("is a no-op (still resolves) when hooks are not provided", async () => {
    const handler = createBorrowNavigateHandler({});

    await expect(handler({ params: { action: "go-back" } })).resolves.toEqual({
      success: true,
    });
    await expect(
      handler({ params: { action: "go-to-swap", fromCurrencyId: "ethereum" } }),
    ).resolves.toEqual({ success: true });
  });

  it("throws a dedicated error when the action is missing", async () => {
    const hooks = buildHooks();
    const handler = createBorrowNavigateHandler(hooks);

    await expect(handler({})).rejects.toThrow("Missing action parameter");
    await expect(handler({ params: {} })).rejects.toThrow("Missing action parameter");

    expect(hooks.onGoBack).not.toHaveBeenCalled();
    expect(hooks.onGoToSwap).not.toHaveBeenCalled();
  });

  it("throws and surfaces the unsupported action value for unknown actions", async () => {
    const hooks = buildHooks();
    const handler = createBorrowNavigateHandler(hooks);

    await expect(handler({ params: { action: "go-to-mars" } })).rejects.toThrow(
      "Unknown borrow navigation action: go-to-mars",
    );

    expect(hooks.onGoBack).not.toHaveBeenCalled();
    expect(hooks.onGoToSwap).not.toHaveBeenCalled();
  });
});
