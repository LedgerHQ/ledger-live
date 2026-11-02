import { renderHook } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { State } from "~/reducers/types";
import type { AccountAssetsByAction } from "LLM/utils/accountAssets";
import { ACCOUNT_DETAIL_PAGE } from "./constants";
import { useInvestActions, type PickAsset } from "./useInvestActions";

const mockCloseDrawer = jest.fn();
const mockDrawer = {
  isOpen: false,
  completionMode: undefined as "currency" | undefined,
};

const mockBlur = { current: undefined as (() => void) | undefined };

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: (effect: () => void | (() => void)) => {
      const cleanup = effect();
      mockBlur.current = typeof cleanup === "function" ? cleanup : undefined;
    },
  };
});

jest.mock("LLM/features/Buy", () => ({
  useOpenBuySell: () => ({
    openBuySellForAccount: jest.fn(),
    openBuySellForCurrency: jest.fn(),
  }),
}));

jest.mock("LLM/features/Swap", () => ({
  useOpenSwap: () => ({ openSwapForAccount: jest.fn() }),
}));

jest.mock("LLM/features/Stake", () => ({
  useOpenStakeDrawer: () => ({ openStakeForAccount: jest.fn() }),
}));

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({
    openDrawer: jest.fn(),
    closeDrawer: mockCloseDrawer,
    isOpen: mockDrawer.isOpen,
    completionMode: mockDrawer.completionMode,
  }),
}));

const account = genAccount("invest-actions", {
  currency: getCryptoCurrencyById("ethereum"),
});

function renderInvestActions(source: string) {
  return renderHook(
    () => useInvestActions(account, [], {} as AccountAssetsByAction, jest.fn() as PickAsset),
    {
      overrideInitialState: (state: State) => ({
        ...state,
        modularDrawer: { ...state.modularDrawer, source },
      }),
    },
  );
}

describe("useInvestActions", () => {
  beforeEach(() => {
    mockCloseDrawer.mockClear();
    mockBlur.current = undefined;
    mockDrawer.isOpen = false;
    mockDrawer.completionMode = undefined;
  });

  it("should close a pending account buy drawer when the screen blurs", () => {
    mockDrawer.isOpen = true;
    mockDrawer.completionMode = "currency";
    renderInvestActions(ACCOUNT_DETAIL_PAGE);

    mockBlur.current?.();

    expect(mockCloseDrawer).toHaveBeenCalledTimes(1);
  });

  it("should leave the drawer open on blur when the catalog request is not from this account", () => {
    mockDrawer.isOpen = true;
    mockDrawer.completionMode = "currency";
    renderInvestActions("deeplink");

    mockBlur.current?.();

    expect(mockCloseDrawer).not.toHaveBeenCalled();
  });

  it("should leave the drawer open on blur when no currency request is pending", () => {
    mockDrawer.isOpen = true;
    renderInvestActions(ACCOUNT_DETAIL_PAGE);

    mockBlur.current?.();

    expect(mockCloseDrawer).not.toHaveBeenCalled();
  });
});
