import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genMockAccount } from "@ledgerhq/live-common/mock/account";
import type { Account, DistributionItem } from "@ledgerhq/types-live";
import * as walletPnlHooks from "@ledgerhq/wallet-pnl/hooks";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { track } from "~/analytics";
import {
  PNL_BUTTON,
  PNL_DETAIL_PAGE,
  AVERAGE_PRICE_PAGE,
  AVERAGE_PRICE_EVENT,
  AVERAGE_PRICE_BUTTON,
  AVERAGE_PRICE_TYPE,
} from "LLM/features/Pnl/const";
import { ASSET_DETAIL_PAGE } from "LLM/features/AssetDetail/const";
import { useAssetPnlViewModel } from "../useAssetPnlViewModel";

const btc = getCryptoCurrencyById("bitcoin");
let btcAccount: Account;
let distributionItem: DistributionItem;

beforeAll(async () => {
  btcAccount = await genMockAccount("btc-1", { currency: btc, operationsSize: 0 });
  distributionItem = {
    currency: btc,
    distribution: 1,
    accounts: [btcAccount],
    amount: 0,
  };
});

const withPnlFlag = (enabled: boolean) =>
  withFlagOverrides({ lwmWallet40: { enabled: true, params: { pnl: enabled } } });

describe("useAssetPnlViewModel", () => {
  let spy: jest.SpyInstance<
    ReturnType<typeof walletPnlHooks.useAssetGroupPnL>,
    Parameters<typeof walletPnlHooks.useAssetGroupPnL>
  >;

  beforeEach(() => {
    spy = jest.spyOn(walletPnlHooks, "useAssetGroupPnL");
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it("forwards the distribution accounts to useAssetGroupPnL when enabled", () => {
    renderHook(() => useAssetPnlViewModel({ distributionItem, enabled: true }), {
      overrideInitialState: withPnlFlag(true),
    });

    expect(spy).toHaveBeenCalledWith(
      distributionItem.accounts,
      expect.anything(),
      expect.anything(),
    );
  });

  it("short-circuits to an empty accounts list when disabled", () => {
    renderHook(() => useAssetPnlViewModel({ distributionItem, enabled: false }), {
      overrideInitialState: withPnlFlag(true),
    });

    expect(spy).toHaveBeenCalledWith([], expect.anything(), expect.anything());
  });

  it("falls back to a zero average entry price when useAssetGroupPnL returns null", () => {
    spy.mockReturnValue(null);

    const { result } = renderHook(() => useAssetPnlViewModel({ distributionItem, enabled: true }), {
      overrideInitialState: withPnlFlag(true),
    });

    expect(result.current.secondary.value).toMatch(/0(?:[.,]00)?/);
  });

  describe("tracking", () => {
    const mockedTrack = jest.mocked(track);

    beforeEach(() => mockedTrack.mockClear());

    it("fires a button_clicked track event when the pnl drawer opens", () => {
      const { result } = renderHook(
        () => useAssetPnlViewModel({ distributionItem, enabled: true }),
        { overrideInitialState: withPnlFlag(true) },
      );

      act(() => result.current.unrealised.onPress());

      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        button: PNL_BUTTON,
        page: ASSET_DETAIL_PAGE,
      });
    });

    it("fires a button_clicked track event with the market_stat_definition button when the secondary drawer opens", () => {
      const { result } = renderHook(
        () => useAssetPnlViewModel({ distributionItem, enabled: true }),
        { overrideInitialState: withPnlFlag(true) },
      );

      act(() => result.current.secondary.onPress());

      expect(mockedTrack).toHaveBeenCalledWith(AVERAGE_PRICE_EVENT, {
        button: AVERAGE_PRICE_BUTTON,
        page: ASSET_DETAIL_PAGE,
        type: AVERAGE_PRICE_TYPE,
      });
    });

    it("does not fire track again when onPress is called twice without closing", () => {
      const { result } = renderHook(
        () => useAssetPnlViewModel({ distributionItem, enabled: true }),
        { overrideInitialState: withPnlFlag(true) },
      );

      act(() => result.current.unrealised.onPress());
      act(() => result.current.unrealised.onPress());

      expect(mockedTrack).toHaveBeenCalledTimes(1);
    });

    it("fires track again after close → reopen", () => {
      const { result } = renderHook(
        () => useAssetPnlViewModel({ distributionItem, enabled: true }),
        { overrideInitialState: withPnlFlag(true) },
      );

      act(() => result.current.unrealised.onPress());
      act(() => result.current.pnlDrawer.onClose());
      act(() => result.current.unrealised.onPress());

      expect(mockedTrack).toHaveBeenCalledTimes(2);
    });

    it("guards across different drawers — opening pnl blocks secondary", () => {
      const { result } = renderHook(
        () => useAssetPnlViewModel({ distributionItem, enabled: true }),
        { overrideInitialState: withPnlFlag(true) },
      );

      act(() => result.current.unrealised.onPress());
      act(() => result.current.secondary.onPress());

      expect(mockedTrack).toHaveBeenCalledTimes(1);
    });

    it("exposes pageName and source on both drawers", () => {
      const { result } = renderHook(
        () => useAssetPnlViewModel({ distributionItem, enabled: true }),
        { overrideInitialState: withPnlFlag(true) },
      );

      expect(result.current.pnlDrawer.pageName).toBe(PNL_DETAIL_PAGE);
      expect(result.current.pnlDrawer.source).toBe(ASSET_DETAIL_PAGE);
      expect(result.current.secondaryDrawer.pageName).toBe(AVERAGE_PRICE_PAGE);
      expect(result.current.secondaryDrawer.source).toBe(ASSET_DETAIL_PAGE);
    });
  });
});
