import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import reducer, {
  INITIAL_STATE,
  closeSwapTransactionStatusDrawer,
  openSwapTransactionStatusDrawer,
  selectIsSwapTransactionStatusDrawerOpen,
  selectSwapTransactionStatusDrawerParams,
  swapTransactionStatusDrawerSelector,
} from "../swapTransactionStatusDrawer";
import type { State } from "../types";

const swapTransactionStatusParams: SwapTransactionStatusParams = {
  swapId: "swap-id",
  provider: "lifi",
  redirectUrl: "ledgerlive://swap/status",
};

const buildState = (swapTransactionStatusDrawer = INITIAL_STATE): State => ({
  ...({} as State),
  swapTransactionStatusDrawer,
});

describe("swapTransactionStatusDrawer reducer", () => {
  it("should expose a closed initial state", () => {
    expect(INITIAL_STATE).toEqual({
      isOpen: false,
      params: null,
    });
  });

  it("should open the drawer with transaction status params", () => {
    const state = reducer(
      INITIAL_STATE,
      openSwapTransactionStatusDrawer(swapTransactionStatusParams),
    );

    expect(state).toEqual({
      isOpen: true,
      params: swapTransactionStatusParams,
    });
  });

  it("should replace params when opening an already open drawer", () => {
    const initialParams: SwapTransactionStatusParams = {
      swapId: "previous-swap-id",
      provider: "changelly",
    };
    const openState = reducer(INITIAL_STATE, openSwapTransactionStatusDrawer(initialParams));

    const state = reducer(openState, openSwapTransactionStatusDrawer(swapTransactionStatusParams));

    expect(state).toEqual({
      isOpen: true,
      params: swapTransactionStatusParams,
    });
  });

  it("should close the drawer and clear params", () => {
    const openState = reducer(
      INITIAL_STATE,
      openSwapTransactionStatusDrawer(swapTransactionStatusParams),
    );

    const state = reducer(openState, closeSwapTransactionStatusDrawer());

    expect(state).toEqual(INITIAL_STATE);
  });
});

describe("swapTransactionStatusDrawer selectors", () => {
  it("should return the drawer slice from state", () => {
    const drawerState = {
      isOpen: true,
      params: swapTransactionStatusParams,
    };

    expect(swapTransactionStatusDrawerSelector(buildState(drawerState))).toEqual(drawerState);
  });

  it("should return whether the drawer is open", () => {
    expect(
      selectIsSwapTransactionStatusDrawerOpen(
        buildState({
          isOpen: true,
          params: swapTransactionStatusParams,
        }),
      ),
    ).toBe(true);
  });

  it("should return the current drawer params", () => {
    expect(
      selectSwapTransactionStatusDrawerParams(
        buildState({
          isOpen: true,
          params: swapTransactionStatusParams,
        }),
      ),
    ).toEqual(swapTransactionStatusParams);
  });
});
