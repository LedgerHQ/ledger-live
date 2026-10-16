import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import type { Currency } from "@domain/entity-currency";
import {
  applyRatePatches,
  calculate,
  calculateMany,
  exportCountervalues,
  hasNewCountervaluesToExport,
  importCountervalues,
} from "./logic";
import { formatCounterValueDay, formatCounterValueHour, pairId } from "./helpers";
import { buildMultiCV, dailyHistory, getBTCValues } from "./mock";
import type { CounterValuesState, CountervaluesSettings } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const NOW = new Date("2026-10-14T15:20:00.000Z");
const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const ripple = getCryptoCurrencyById("ripple");
const usd = getFiatCurrencyByTicker("USD");
const eur = getFiatCurrencyByTicker("EUR");
const btcUsd = pairId({ from: bitcoin, to: usd });
const ethUsd = pairId({ from: ethereum, to: usd });
const xrpUsd = pairId({ from: ripple, to: usd });
const btcEur = pairId({ from: bitcoin, to: eur });
const PAIRS: Array<{ from: Currency; to: Currency }> = [
  { from: bitcoin, to: usd },
  { from: ethereum, to: usd },
  { from: ripple, to: usd },
  { from: bitcoin, to: eur },
];

type Patches = Array<Record<string, Record<string, unknown>>>;

// applyRatePatches keeps a pair's Map and cache entry when a load leaves its values as they were.
// These checks compare it with rebuilding every pair a load touches, as it did before: no conversion,
// cache, data or export may differ, and identity is kept only for equal content. Each check has a
// control proving it can see the opposite outcome.

describe.each([
  ["a restored state, gaps filled", () => restoredState(settingsFor(true)), settingsFor(true)],
  ["a restored state, gaps left", () => restoredState(settingsFor(false)), settingsFor(false)],
  ["the shared mock fixture", mockState, settingsFor(true)],
])("applyRatePatches on %s", (_name, build, settings) => {
  it("gives the same conversions, cache, data and export as a rebuild after every load", () => {
    const start = build();
    const rebuilt = run(start, settings, rebuildEveryTouchedPair);
    const kept = run(start, settings, applyRatePatches);

    loads(start).forEach(({ name }, i) => {
      const context = `after load ${i + 1}: ${name}`;
      expect({ context, out: conversions(kept[i]) }).toEqual({
        context,
        out: conversions(rebuilt[i]),
      });
      expect(cacheContent(kept[i])).toEqual(cacheContent(rebuilt[i]));
      expect(Object.keys(kept[i].data).sort()).toEqual(Object.keys(rebuilt[i].data).sort());
      for (const id of Object.keys(rebuilt[i].data)) {
        expect([...kept[i].data[id]]).toEqual([...rebuilt[i].data[id]]);
      }
      expect(exportCountervalues(kept[i], settings.trackingPairs)).toEqual(
        exportCountervalues(rebuilt[i], settings.trackingPairs),
      );
      const previousKept = i === 0 ? start : kept[i - 1];
      const previousRebuilt = i === 0 ? start : rebuilt[i - 1];
      expect(hasNewCountervaluesToExport(previousKept, kept[i])).toBe(
        hasNewCountervaluesToExport(previousRebuilt, rebuilt[i]),
      );
    });
  });

  it("control: the comparison sees a moved latest", () => {
    const start = build();
    const states = run(start, settings, applyRatePatches);
    const moved = loads(start).findIndex(({ name }) => name === "a latest that moved");

    expect(conversions(states[moved])).not.toEqual(conversions(states[moved - 1]));
  });
});

// A kept cache entry is not rebuilt when the clock crosses midnight, so it lacks the days a rebuild
// would fill. Those days all come after the pair's last rate, where lenseRate answers the latest
// rate without reading the map: the conversions stay the same.
describe("applyRatePatches while the clock moves 13 hours between loads", () => {
  const settings = settingsFor(true);
  const STEP = 13 * HOUR;

  it("gives the same conversions and export as a rebuild after every load", () => {
    const start = restoredState(settings);
    const rebuilt = run(start, settings, rebuildEveryTouchedPair, STEP);
    const kept = run(start, settings, applyRatePatches, STEP);

    loads(start).forEach(({ name }, i) => {
      const context = `after load ${i + 1}: ${name}`;
      jest.setSystemTime(NOW.getTime() + (i + 1) * STEP);
      expect({ context, out: conversions(kept[i]) }).toEqual({
        context,
        out: conversions(rebuilt[i]),
      });
      expect(exportCountervalues(kept[i], settings.trackingPairs)).toEqual(
        exportCountervalues(rebuilt[i], settings.trackingPairs),
      );
    });
  });

  it("only misses filled days after each pair's last rate", () => {
    const start = restoredState(settings);
    const rebuilt = run(start, settings, rebuildEveryTouchedPair, STEP);
    const kept = run(start, settings, applyRatePatches, STEP);
    const last = kept.length - 1;
    let missing = 0;

    for (const [id, entry] of Object.entries(rebuilt[last].cache)) {
      const keptEntry = kept[last].cache[id];
      for (const key of entry.map.keys()) {
        if (keptEntry.map.has(key)) continue;
        missing++;
        expect({ id, key, afterLastRate: key > (keptEntry.stats.earliest ?? "") }).toEqual({
          id,
          key,
          afterLastRate: true,
        });
      }
    }
    // Control: the clock did cross midnight, so there is something to miss.
    expect(missing).toBeGreaterThan(0);
  });
});

describe("applyRatePatches keeps identity only for equal content", () => {
  const settings = settingsFor(true);

  it("keeps the Maps, the cache entries and both objects when every value is equal", () => {
    const state = steadyState(settings);
    const same = [
      { [btcUsd]: history(state, btcUsd) },
      { [ethUsd]: { latest: state.data[ethUsd].get("latest") } },
    ];

    const next = apply(state, same, settings);

    expect(next.data[btcUsd]).toBe(state.data[btcUsd]);
    expect(next.cache[btcUsd]).toBe(state.cache[btcUsd]);
    expect(next.data[ethUsd]).toBe(state.data[ethUsd]);
    expect(next.cache[ethUsd]).toBe(state.cache[ethUsd]);
    expect(next.data).toBe(state.data);
    expect(next.cache).toBe(state.cache);
  });

  it("control: a rebuild of the same patches replaces them all", () => {
    const state = steadyState(settings);
    const same = [{ [btcUsd]: history(state, btcUsd) }];

    const next = rebuildEveryTouchedPair(state, nextOf(state), same, settings);

    expect(next.cache[btcUsd]).not.toBe(state.cache[btcUsd]);
    expect(next.cache).not.toBe(state.cache);
  });

  it("replaces only the pair that changed, and then both objects", () => {
    const state = steadyState(settings);
    const patches = [
      { [btcUsd]: { ...history(state, btcUsd), [day(1)]: 1 } },
      { [ethUsd]: history(state, ethUsd) },
    ];

    const next = apply(state, patches, settings);

    expect(next.data[btcUsd]).not.toBe(state.data[btcUsd]);
    expect(next.cache[btcUsd]).not.toBe(state.cache[btcUsd]);
    expect(next.data[ethUsd]).toBe(state.data[ethUsd]);
    expect(next.cache[ethUsd]).toBe(state.cache[ethUsd]);
    expect(next.data).not.toBe(state.data);
    expect(next.cache).not.toBe(state.cache);
  });

  it("rebuilds the cache entry, not the Map, when holes are checked", () => {
    const state = { ...steadyState(settings), checkHolesOnNextLoad: true };

    const next = apply(state, [{ [btcUsd]: history(state, btcUsd) }], settings);

    expect(next.data[btcUsd]).toBe(state.data[btcUsd]);
    expect(next.cache[btcUsd]).not.toBe(state.cache[btcUsd]);
  });

  it("rebuilds the cache entry of a pair without status, as holes are checked for it", () => {
    const state = steadyState(settings);
    const status = { ...state.status };
    delete status[btcUsd];

    const next = applyRatePatches(
      state,
      { ...nextOf(state), status },
      [{ [btcUsd]: history(state, btcUsd) }],
      settings,
    );

    expect(next.data[btcUsd]).toBe(state.data[btcUsd]);
    expect(next.cache[btcUsd]).not.toBe(state.cache[btcUsd]);
  });

  it("gives a pair it did not know a Map even from an empty patch, as a rebuild does", () => {
    const state = steadyState(settings);

    const kept = apply(state, [{ [btcEur]: {} }], settings);
    const rebuilt = rebuildEveryTouchedPair(state, nextOf(state), [{ [btcEur]: {} }], settings);

    expect([...kept.data[btcEur]]).toEqual([]);
    expect([...rebuilt.data[btcEur]]).toEqual([]);
    expect(kept.cache[btcEur]).toEqual(rebuilt.cache[btcEur]);
  });
});

describe.each([
  [false, true],
  [true, false],
])("applyRatePatches when autofillGaps goes from %s to %s", (before, after) => {
  it("rebuilds the cache entry of an unchanged pair, as a rebuild does", () => {
    const state = steadyState(settingsFor(before));
    const same = [{ [btcUsd]: history(state, btcUsd) }];

    const kept = apply(state, same, settingsFor(after));
    const rebuilt = rebuildEveryTouchedPair(state, nextOf(state), same, settingsFor(after));

    expect(kept.data[btcUsd]).toBe(state.data[btcUsd]);
    expect(cacheContent(kept)[btcUsd]).toEqual(cacheContent(rebuilt)[btcUsd]);
    expect(conversions(kept)).toEqual(conversions(rebuilt));
    // Control: the setting does change the entry, so keeping it would have been wrong.
    expect(cacheContent(kept)[btcUsd]).not.toEqual(cacheContent(state)[btcUsd]);
  });

  it("control: keeps the entry when the setting stays the same", () => {
    const state = steadyState(settingsFor(before));

    const next = apply(state, [{ [btcUsd]: history(state, btcUsd) }], settingsFor(before));

    expect(next.cache[btcUsd]).toBe(state.cache[btcUsd]);
  });
});

describe("applyRatePatches: a changed value always yields a new Map", () => {
  const settings = settingsFor(true);

  it("for every key a pair holds, the latest included, and leaves the old Map as it was", () => {
    // A restore drops the latest rate: a load brings it back.
    const state = apply(restoredState(settings), [{ [btcUsd]: { latest: 61_000 } }], settings);
    const before = [...state.data[btcUsd]];
    const keys = before.map(([k]) => k);
    expect(keys).toContain("latest");

    for (const key of keys) {
      const value = (state.data[btcUsd].get(key) ?? 0) + 1;
      const next = apply(state, [{ [btcUsd]: { [key]: value } }], settings);
      expect({ key, replaced: next.data[btcUsd] !== state.data[btcUsd] }).toEqual({
        key,
        replaced: true,
      });
      expect(next.data[btcUsd].get(key)).toBe(value);
      expect(next.cache[btcUsd]).not.toBe(state.cache[btcUsd]);
      // What the cache view and the conversions select.
      expect(next.data).not.toBe(state.data);
      expect(next.cache).not.toBe(state.cache);
    }
    expect([...state.data[btcUsd]]).toEqual(before);
  });

  it("for a key the pair did not hold", () => {
    const state = restoredState(settings);

    const next = apply(state, [{ [btcUsd]: { [hour(0)]: 1 } }], settings);

    expect(next.data[btcUsd]).not.toBe(state.data[btcUsd]);
    expect(state.data[btcUsd].has(hour(0))).toBe(false);
  });

  it("when an equal patch comes first and a changed one after it", () => {
    const state = restoredState(settings);
    const latest = state.data[btcUsd].get("latest");

    const next = apply(state, [{ [btcUsd]: { latest } }, { [btcUsd]: { [day(1)]: 1 } }], settings);

    expect(next.data[btcUsd]).not.toBe(state.data[btcUsd]);
    expect(next.data[btcUsd].get(day(1))).toBe(1);
    expect(next.data[btcUsd].get("latest")).toBe(latest);
  });

  it("for a value that is equal by == but not Object.is", () => {
    const state = apply(restoredState(settings), [{ [btcUsd]: { latest: 0 } }], settings);

    const next = apply(state, [{ [btcUsd]: { latest: -0 } }], settings);

    expect(next.data[btcUsd]).not.toBe(state.data[btcUsd]);
    expect(Object.is(next.data[btcUsd].get("latest"), -0)).toBe(true);
  });
});

beforeAll(() => {
  jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
  jest.setSystemTime(NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

/**
 * Applies the patches the way applyRatePatches did before it kept unchanged pairs: every pair a
 * patch touches gets its cache entry rebuilt, which an entry missing from `next` forces.
 */
function rebuildEveryTouchedPair(
  previous: CounterValuesState,
  next: Pick<CounterValuesState, "data" | "cache" | "status">,
  patches: Patches,
  settings: CountervaluesSettings,
): CounterValuesState {
  const cache = { ...next.cache };
  for (const patch of patches) for (const id of Object.keys(patch)) delete cache[id];
  return applyRatePatches(previous, { ...next, cache }, patches, settings);
}

/**
 * Applies the same loads in order from the same starting state, the clock moving `stepMs` before
 * each load, as a storage cycle would: each load's status marks the pairs it fetched.
 */
function run(
  start: CounterValuesState,
  settings: CountervaluesSettings,
  applyPatches: typeof applyRatePatches,
  stepMs = 0,
): CounterValuesState[] {
  jest.setSystemTime(NOW);
  const states: CounterValuesState[] = [];
  let state = start;
  for (const { patches } of loads(start)) {
    jest.setSystemTime(Date.now() + stepMs);
    const next = nextOf(state);
    for (const patch of patches)
      for (const id of Object.keys(patch)) next.status[id] = { timestamp: 1 };
    state = applyPatches(state, next, patches, settings);
    states.push(state);
  }
  jest.setSystemTime(NOW);
  return states;
}

// One storage cycle per entry: what successive loads hand to applyRatePatches.
function loads(state: CounterValuesState): Array<{ name: string; patches: Patches }> {
  const btcHistory = history(state, btcUsd);
  const ethHistory = history(state, ethUsd);
  const latest = (id: string) => state.data[id]?.get("latest") ?? 1;
  return [
    {
      name: "the same history again and the same latest",
      patches: [{ [btcUsd]: btcHistory }, { [ethUsd]: ethHistory }],
    },
    {
      name: "empty history windows",
      patches: [{ [btcUsd]: {} }, { [ethUsd]: {} }, { [xrpUsd]: {} }],
    },
    { name: "a latest that moved", patches: [{ [ethUsd]: { latest: latest(ethUsd) + 7 } }] },
    {
      name: "a new hour and the same latest",
      patches: [{ [btcUsd]: { [hour(0)]: 61_999, latest: latest(btcUsd) } }],
    },
    { name: "a missing latest", patches: [{ [btcUsd]: { latest: null } }] },
    { name: "a new pair", patches: [{ [btcEur]: { [day(2)]: 55_000, latest: 56_000 } }] },
    {
      name: "a new pair with an empty window",
      patches: [{ [pairId({ from: ripple, to: eur })]: {} }],
    },
    { name: "nothing to apply", patches: [] },
  ];
}

// Every conversion a screen can ask: each day and hour of the span, no date, every option.
function conversions(state: CounterValuesState): unknown[] {
  const dates: Array<Date | null | undefined> = [undefined, null];
  for (let h = 45 * 24; h >= -48; h -= 5) dates.push(new Date(NOW.getTime() - h * HOUR));
  const out: unknown[] = [];
  for (const { from, to } of PAIRS) {
    for (const date of dates) {
      for (const reverse of [false, true]) {
        for (const disableRounding of [false, true]) {
          out.push(
            calculate(state, { value: 123_456_789, from, to, date, reverse, disableRounding }),
          );
        }
      }
    }
    out.push(
      calculateMany(
        state,
        dates.map(date => ({ value: 987_654_321, date })),
        { from, to, disableRounding: true },
      ),
    );
  }
  return out;
}

function cacheContent(state: CounterValuesState) {
  return Object.fromEntries(
    Object.entries(state.cache).map(([id, entry]) => [id, { ...entry, map: [...entry.map] }]),
  );
}

// 30 days of daily rates with two holes, and the last 24 hours, as a restore would bring them.
function restoredState(settings: CountervaluesSettings): CounterValuesState {
  const btc: Record<string, number> = {};
  const eth: Record<string, number> = {};
  for (let d = 30; d >= 1; d--) {
    if (d === 12 || d === 5) continue;
    btc[day(d)] = 60_000 + d * 100;
    eth[day(d)] = 2_500 + d * 3;
  }
  for (let h = 23; h >= 1; h--) {
    btc[hour(h)] = 61_000 + h;
    eth[hour(h)] = 2_600 + h;
  }
  return importCountervalues({ status: {}, [btcUsd]: btc, [ethUsd]: eth }, settings);
}

// The shared mock fixture: rates with explicit holes, built without a restore. The mock builds its
// cache entries by hand (no fallback, no filled days), which the store never holds: a first regular
// load rebuilds them through generateCache, as any load of these pairs would.
function mockState(): CounterValuesState {
  const btc = getBTCValues();
  const built = buildMultiCV([
    {
      pair: { from: bitcoin, to: usd },
      history: dailyHistory([
        [new Date(NOW.getTime() - 3 * DAY), 61_000],
        [new Date(NOW.getTime() - 2 * DAY), 61_500],
      ]),
      latest: 62_000,
    },
    { pair: { from: ethereum, to: usd }, latest: 62_000 * btc.ETH, holes: [day(4)] },
    { pair: { from: ripple, to: usd }, latest: 62_000 * btc.XRP },
  ]);
  const rebuild = [{ [btcUsd]: {} }, { [ethUsd]: {} }, { [xrpUsd]: {} }];
  return rebuildEveryTouchedPair(built, { ...built }, rebuild, settingsFor(true));
}

// A first load clears the post-restore hole check, as on the device.
function steadyState(settings: CountervaluesSettings): CounterValuesState {
  const restored = restoredState(settings);
  const status = { [btcUsd]: { timestamp: 1 }, [ethUsd]: { timestamp: 1 } };
  return applyRatePatches(restored, { ...restored, status }, [], settings);
}

function apply(
  state: CounterValuesState,
  patches: Patches,
  settings: CountervaluesSettings,
): CounterValuesState {
  return applyRatePatches(state, nextOf(state), patches, settings);
}

// What a load hands applyRatePatches: copies of the containers, the same Maps and cache entries.
function nextOf(state: CounterValuesState) {
  return { data: { ...state.data }, cache: { ...state.cache }, status: { ...state.status } };
}

function history(state: CounterValuesState, id: string): Record<string, number> {
  return Object.fromEntries([...(state.data[id] ?? new Map())].filter(([k]) => k !== "latest"));
}

function settingsFor(autofillGaps: boolean): CountervaluesSettings {
  return {
    trackingPairs: PAIRS.map(pair => ({ ...pair, startDate: new Date(NOW.getTime() - 40 * DAY) })),
    autofillGaps,
    refreshRate: 60_000,
    marketCapBatchingAfterRank: 20,
  };
}

function day(daysAgo: number): string {
  return formatCounterValueDay(new Date(NOW.getTime() - daysAgo * DAY));
}

function hour(hoursAgo: number): string {
  return formatCounterValueHour(new Date(NOW.getTime() - hoursAgo * HOUR));
}
