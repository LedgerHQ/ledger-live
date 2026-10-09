import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { pairId } from "@domain/entity-market-countervalues";
import { setCountervaluesPollingTriggerLoad } from "@features/platform-market-countervalues";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { addExtraTrackingPairs } from "~/renderer/reducers/countervaluesExtraTracking";
import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { replaceAccounts } from "~/renderer/actions/accounts";
import { createCountervaluesSettingsSelector } from "./countervalues";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");
const btcAccount = genAccount("countervalues-settings-btc", { currency: bitcoin });

function useCountervaluesSettings() {
  const selectSettings = useMemo(createCountervaluesSettingsSelector, []);
  return useSelector(selectSettings);
}

describe("createCountervaluesSettingsSelector", () => {
  it("computes the settings from the accounts, the flag and LiveConfig", () => {
    const { result } = renderHook(useCountervaluesSettings, {
      initialState: {
        accounts: [btcAccount],
        ...withFlagOverrides({
          llCounterValueGranularitiesRates: { enabled: true, params: { daily: 30, hourly: 2 } },
        }),
      },
    });

    expect(result.current).toEqual({
      trackingPairs: [expect.objectContaining({ from: bitcoin, to: usd })],
      autofillGaps: true,
      refreshRate: LiveConfig.getValueByKey("config_countervalues_refreshRate"),
      marketCapBatchingAfterRank: LiveConfig.getValueByKey(
        "config_countervalues_marketCapBatchingAfterRank",
      ),
      granularitiesRates: { daily: 30, hourly: 2 },
    });
  });

  it("leaves the granularities out when the flag is off", () => {
    const { result } = renderHook(useCountervaluesSettings, {
      initialState: { accounts: [btcAccount] },
    });

    expect(result.current.granularitiesRates).toBeUndefined();
  });

  it("keeps the same object until the tracked pairs change", () => {
    const { result, rerender, store } = renderHook(useCountervaluesSettings, {
      initialState: { accounts: [btcAccount] },
    });
    const first = result.current;

    rerender();
    act(() => {
      store.dispatch(setCountervaluesPollingTriggerLoad(true));
      // a resync hands back new account objects tracking the same pairs
      store.dispatch(replaceAccounts([{ ...btcAccount }]));
    });
    expect(result.current).toBe(first);

    const ethUsd = { from: ethereum, to: usd, startDate: new Date("2026-01-01") };
    act(() => {
      store.dispatch(addExtraTrackingPairs([ethUsd]));
    });
    expect(result.current).not.toBe(first);
    expect(result.current.trackingPairs.map(pairId).sort()).toEqual(
      [pairId(ethUsd), pairId({ from: bitcoin, to: usd })].sort(),
    );
  });
});
