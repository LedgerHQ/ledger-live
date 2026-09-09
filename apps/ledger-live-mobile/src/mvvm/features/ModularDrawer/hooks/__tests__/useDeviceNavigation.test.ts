import { renderHook, act } from "@tests/test-renderer";
import { useDeviceNavigation } from "../useDeviceNavigation";
import {
  arbitrumToken,
  mockBtcCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigationProp } from "@react-navigation/native";
import { ModularDrawerStep } from "../../types";
import { State } from "~/reducers/types";
import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { resolveWalletApiSpendableBalance } from "@ledgerhq/live-common/wallet-api/converters";
import aleoExtensions from "@ledgerhq/live-common/families/aleo/bridgeExtensions";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockNavigation: Partial<NavigationProp<Record<string, never>>> = {
  navigate: mockNavigate,
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

describe("useDeviceNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to device with a crypto currency", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const onAccountSelected = jest.fn();
    const { result, store } = renderHook(() =>
      useDeviceNavigation({ onClose, resetSelection, onAccountSelected }),
    );

    const crypto = mockBtcCryptoCurrency;
    act(() => result.current.navigateToDeviceWithCurrency(crypto));

    expect(onClose).toHaveBeenCalled();
    expect(resetSelection).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
    expect(store.getState().modularDrawer.step).toBe(ModularDrawerStep.Asset);
  });

  it("calls onSilentClose instead of onClose when provided", () => {
    const onClose = jest.fn();
    const onSilentClose = jest.fn();
    const resetSelection = jest.fn();
    const onAccountSelected = jest.fn();
    const { result } = renderHook(() =>
      useDeviceNavigation({ onClose, onSilentClose, resetSelection, onAccountSelected }),
    );

    act(() => result.current.navigateToDeviceWithCurrency(mockBtcCryptoCurrency));

    expect(onSilentClose).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("navigates to device with a token currency (uses parent)", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const onAccountSelected = jest.fn();
    const { result } = renderHook(() =>
      useDeviceNavigation({ onClose, resetSelection, onAccountSelected }),
    );

    const token = arbitrumToken;
    act(() => result.current.navigateToDeviceWithCurrency(token));

    expect(mockNavigate).toHaveBeenCalled();
  });

  it("navigates to device with inline flow", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const onAccountSelected = jest.fn();
    const { result } = renderHook(
      () => useDeviceNavigation({ onClose, resetSelection, onAccountSelected }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: { ...state.modularDrawer, flow: "receive" },
        }),
      },
    );

    act(() => result.current.navigateToDeviceWithCurrency(mockBtcCryptoCurrency));

    expect(mockNavigate).toHaveBeenCalled();
    const callArgs = mockNavigate.mock.calls[0];
    expect(callArgs[1].params.inline).toBe(true);
  });

  it("navigates to device with non-inline flow", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const onAccountSelected = jest.fn();
    const { result } = renderHook(
      () => useDeviceNavigation({ onClose, resetSelection, onAccountSelected }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: { ...state.modularDrawer, flow: "add_account" },
        }),
      },
    );

    act(() => result.current.navigateToDeviceWithCurrency(mockBtcCryptoCurrency));

    expect(mockNavigate).toHaveBeenCalled();
    const callArgs = mockNavigate.mock.calls[0];
    expect(callArgs[1].params.inline).toBe(false);
  });
});

// The two ARC-22 stablecoins in the production swap whitelist. Aleo token sync is off
// (`enableTokens: false`), so neither ever has a sub-account: selecting one always makes the
// drawer build an empty token account on the fly, exactly like the desktop drawer does.
const makeArc22Token = (id: string, ticker: string, programId: string): TokenCurrency =>
  ({
    type: "TokenCurrency",
    id: `aleo/arc22/${id}`,
    name: ticker,
    ticker,
    contractAddress: programId,
    parentCurrencyId: getCryptoCurrencyById("aleo").id,
    tokenType: "arc22",
    units: [{ name: ticker, code: ticker, magnitude: 6 }],
  }) as TokenCurrency;

describe("useDeviceNavigation - Aleo ARC-22 token with no sub-account", () => {
  const aleoAccount: Account = genAccount("aleo-1", { currency: getCryptoCurrencyById("aleo") });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAccountBridge).mockReturnValue(aleoExtensions as never);
  });

  /** Picks `token` in the drawer, then replays the device flow success with `aleoAccount`. */
  function selectTokenThenAddAccount(token: TokenCurrency) {
    const onAccountSelected = jest.fn();
    const { result } = renderHook(() =>
      useDeviceNavigation({ onClose: jest.fn(), resetSelection: jest.fn(), onAccountSelected }),
    );

    act(() => result.current.navigateToDeviceWithCurrency(token));

    const { onSuccess } = mockNavigate.mock.calls[0][1].params;
    act(() => onSuccess({ scannedAccounts: [aleoAccount], selected: [aleoAccount] }));

    expect(onAccountSelected).toHaveBeenCalledTimes(1);
    return onAccountSelected.mock.calls[0] as [AccountLike, Account | undefined];
  }

  it.each([
    ["USAD", makeArc22Token("usad", "USAD", "usad_stablecoin.aleo")],
    ["USDCx", makeArc22Token("usdcx", "USDCx", "usdcx_stablecoin.aleo")],
  ])("hands back a token account with no transparentBalance for %s", (_ticker, token) => {
    const [account, parent] = selectTokenThenAddAccount(token);

    expect(account.type).toBe("TokenAccount");
    expect((account as TokenAccount).token.id).toBe(token.id);
    expect(parent).toBe(aleoAccount);
    // The shape the crash hinged on: the sync never ran, so the family field is simply absent.
    expect(account).not.toHaveProperty("transparentBalance");
  });

  it.each([
    ["USAD", makeArc22Token("usad", "USAD", "usad_stablecoin.aleo")],
    ["USDCx", makeArc22Token("usdcx", "USDCx", "usdcx_stablecoin.aleo")],
  ])("resolves a usable wallet-api spendable balance for %s", async (_ticker, token) => {
    const [account, parent] = selectTokenThenAddAccount(token);

    // Same call the account.request / account.list handlers make (wallet-api/react.ts:611, :644).
    // Undefined here is what used to reach the wallet-api serializer and throw
    // "Cannot read properties of undefined (reading 'toString')".
    const spendableBalance = await resolveWalletApiSpendableBalance(account, parent);

    expect(BigNumber.isBigNumber(spendableBalance)).toBe(true);
    expect(spendableBalance).toEqual(new BigNumber(0));
  });
});
