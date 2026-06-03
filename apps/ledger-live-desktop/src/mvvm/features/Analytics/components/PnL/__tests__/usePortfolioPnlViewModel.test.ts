import { BigNumber } from "bignumber.js";
import { usePortfolioPnL } from "@ledgerhq/wallet-pnl/hooks";
import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { usePortfolioPnlViewModel } from "../usePortfolioPnlViewModel";

jest.mock("@ledgerhq/wallet-pnl/hooks", () => ({
  usePortfolioPnL: jest.fn(),
}));

const mockedUsePortfolioPnL = jest.mocked(usePortfolioPnL);

const ZERO = new BigNumber(0);

const flagsOn = withFlagOverrides({ lwdWallet40: { enabled: true, params: { pnl: true } } });
const flagsOff = withFlagOverrides({ lwdWallet40: { enabled: false } });

const stateWithAccounts = { accounts: [BTC_ACCOUNT] };

type RenderOptions = Parameters<
  typeof renderHook<ReturnType<typeof usePortfolioPnlViewModel>, never>
>[1];

const renderPortfolioPnlViewModel = (options: RenderOptions = {}) =>
  renderHook(() => usePortfolioPnlViewModel(), options);

beforeEach(() => {
  jest.clearAllMocks();
  mockedUsePortfolioPnL.mockReturnValue({
    unrealisedPnL: ZERO,
    realisedPnL: ZERO,
    totalPnL: ZERO,
    costBasis: ZERO,
    lifetimeCost: ZERO,
  });
});

describe("usePortfolioPnlViewModel", () => {
  it("derives shouldDisplayPnl from the wallet feature flag", () => {
    const on = renderPortfolioPnlViewModel({
      initialState: { ...flagsOn, ...stateWithAccounts },
    });
    expect(on.result.current.shouldDisplayPnl).toBe(true);

    const off = renderPortfolioPnlViewModel({
      initialState: { ...flagsOff, ...stateWithAccounts },
    });
    expect(off.result.current.shouldDisplayPnl).toBe(false);
  });

  it("hides the section when there are no accounts", () => {
    const { result } = renderPortfolioPnlViewModel({
      initialState: { ...flagsOn, accounts: [] },
    });

    expect(result.current.shouldDisplayPnl).toBe(false);
  });

  it("forwards the flattened accounts to usePortfolioPnL", () => {
    renderPortfolioPnlViewModel({ initialState: { ...flagsOn, ...stateWithAccounts } });

    expect(mockedUsePortfolioPnL).toHaveBeenCalledWith(
      [BTC_ACCOUNT],
      expect.anything(),
      expect.anything(),
    );
  });

  it("emits unrealisedReturn, realisedReturn, and totalReturn cards and a 3-bucket detail", () => {
    const { result } = renderPortfolioPnlViewModel({
      initialState: { ...flagsOn, ...stateWithAccounts },
    });

    expect(result.current.items.map(i => i.id)).toEqual([
      "unrealisedReturn",
      "realisedReturn",
      "totalReturn",
    ]);
    expect(result.current.detail.items).toHaveLength(3);
  });

  it("opens the detail dialog when onOpen is called", () => {
    const { result } = renderPortfolioPnlViewModel({
      initialState: { ...flagsOn, ...stateWithAccounts },
    });
    expect(result.current.dialog.isOpen).toBe(false);

    act(() => result.current.dialog.onOpen());

    expect(result.current.dialog.isOpen).toBe(true);
  });
});
