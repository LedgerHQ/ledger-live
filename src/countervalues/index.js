// @flow
/* eslint-disable no-param-reassign */
import { BigNumber } from "bignumber.js";
// $FlowFixMe
import React, { Component } from "react";
import invariant from "invariant";
import throttle from "lodash/throttle";
import merge from "lodash/merge";
import chunk from "lodash/chunk";
import { connect } from "react-redux";
import { createSelector, createStructuredSelector } from "reselect";
import type { Dispatch } from "redux";
import type {
  Input,
  Module,
  Polling,
  Histodays,
  CounterValuesState,
  PairOptExchange,
  PairConversion,
  Exchange,
  RatesMap,
  RateGranularity,
  PollAPIPair,
} from "./types";
import network from "../network";
import { getEnv } from "../env";

type PollingProviderOwnProps = {
  children: React$Element<*>,
  pollThrottle: number,
  pollInitDelay: number,
  autopollInterval: number,
  poll: () => *,
  wipe: () => *,
  pairsKey: string,
};

const POLL = "LEDGER_CV:POLL";
const WIPE = "LEDGER_CV:WIPE";
const IMPORT = "LEDGER_CV:IMPORT";

type PollAction = {
  type: *,
  hourly?: *,
  daily?: *,
};

type ImportAction = {
  type: *,
  hourly: *,
  daily: *,
};

const twoDigits = (n: number) => (n > 9 ? `${n}` : `0${n}`);

/**
 * efficient implementation of YYYY-MM-DD formatter
 * @memberof countervalue
 */
export const formatCounterValueDay = (d: Date) =>
  `${d.getFullYear()}-${twoDigits(d.getMonth() + 1)}-${twoDigits(d.getDate())}`;

/**
 * efficient implementation of YYYY-MM-DD formatter
 * @memberof countervalue
 */
export const formatCounterValueHour = (d: Date) =>
  `${d.getFullYear()}-${twoDigits(d.getMonth() + 1)}-${twoDigits(
    d.getDate()
  )}T${twoDigits(d.getHours())}`;

// This do one big query to fetch everything
export const getRatesAllInOnce = async (
  getAPIBaseURL: () => string,
  pairs: PollAPIPair[],
  rate: string
) => {
  const { data }: { data: mixed } = await network({
    method: "POST",
    url: getAPIBaseURL() + "/rates/" + rate,
    data: {
      pairs,
    },
  });
  return data;
};

export const getRatesBatched = (batchSize: number) => async (
  getAPIBaseURL: () => string,
  allPairs: PollAPIPair[],
  rate: string
) => {
  const url = getAPIBaseURL() + "/rates/" + rate;
  const all = await Promise.all(
    chunk(allPairs, batchSize).map((pairs) =>
      network({ method: "POST", url, data: { pairs } })
        .then((r) => ({ error: null, result: r.data }))
        .catch((error) => ({ result: null, error }))
    )
  );
  const errors = all.map((o) => o.error).filter((e) => e);
  const results = all.map((o) => o.result).filter((r) => r);
  if (results.length === 0 && errors.length > 0) throw errors[0];
  return merge({}, ...results);
};

// This do one query per rate (lighter query)
export const getRatesSplitPerRate = getRatesBatched(1);

export const defaultTickerAliases = {
  WETH: "ETH",
};

const defaultGetAPIBaseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

function createCounterValues<State>({
  tickerAliases,
  getAPIBaseURL: userGetAPIBaseURL,
  storeSelector,
  pairsSelector,
  setExchangePairsAction,
  maximumDays,
  maximumHours,
  addExtraPollingHooks,
  log,
  getDailyRatesImplementation,
  getHourlyRatesImplementation,
  fetchExchangesForPairImplementation,
  fetchTickersByMarketcapImplementation,
}: Input<State>): Module<State> {
  type Poll = () => (
    Dispatch<*>,
    () => State,
    rate: RateGranularity
  ) => Promise<*>;

  const getAPIBaseURL = userGetAPIBaseURL || defaultGetAPIBaseURL;

  const aliases = tickerAliases || defaultTickerAliases;

  const getDailyRates = getDailyRatesImplementation || getRatesBatched(8);
  const getHourlyRates = getHourlyRatesImplementation || getRatesBatched(2);

  const maxHours = maximumHours || 7 * 24;

  const pairOptExchangeExtractor = (
    _store,
    { from, to, exchange }
  ): PairOptExchange => ({
    from,
    to,
    exchange,
  });

  const conversionExtractor = (
    _store,
    { from, fromExchange, intermediary, toExchange, to }
  ): PairConversion => ({
    from,
    fromExchange,
    intermediary,
    toExchange,
    to,
  });

  const valueExtractor = (_, { value }: { value: BigNumber }) => value;

  const disableRoundingExtractor = (
    _,
    { disableRounding }: { disableRounding?: boolean }
  ) => disableRounding;

  const dateExtractor = (_, { date }: { date?: Date }) => date;

  const currencyTicker = (c) => aliases[c.ticker] || c.ticker;

  function lenseRatesInMap(
    rates: RatesMap,
    { from, to, exchange }
  ): ?Histodays {
    if (!exchange) return;
    const a = rates[currencyTicker(to)];
    if (!a) return;
    const b = a[currencyTicker(from)];
    if (!b) return;
    return b[exchange];
  }

  function putMapInRates(
    rates: RatesMap,
    { from, to, exchange },
    map: Histodays
  ) {
    if (!exchange) return;
    const toTicker = currencyTicker(to);
    if (!rates[toTicker]) rates[toTicker] = {};
    const a = rates[toTicker];
    const fromTicker = currencyTicker(from);
    if (!a[fromTicker]) a[fromTicker] = {};
    const b = a[fromTicker];
    b[exchange] = map;
  }

  const getRate = (store, pair, date) => {
    if (currencyTicker(pair.from) === currencyTicker(pair.to)) return 1;
    if (date) {
      const hourly = lenseRatesInMap(store.hourly, pair);
      if (hourly) {
        const pick = hourly[formatCounterValueHour(date)];
        if (pick) return pick;
      }
    }
    const daily = lenseRatesInMap(store.daily, pair);
    return (
      daily && ((date && daily[formatCounterValueDay(date)]) || daily.latest)
    );
  };

  const getRateWithIntermediary = (
    store,
    { from, fromExchange, intermediary, toExchange, to },
    date
  ) => {
    const fromPair = { from, to: intermediary, exchange: fromExchange };
    const toPair = { from: intermediary, to, exchange: toExchange };
    const a = getRate(store, fromPair, date);
    const b = getRate(store, toPair, date);
    return a && b && a * b;
  };

  const rateSelector = createSelector(
    storeSelector,
    pairOptExchangeExtractor,
    dateExtractor,
    getRate
  );

  const rateWithIntermediarySelector = createSelector(
    storeSelector,
    conversionExtractor,
    dateExtractor,
    getRateWithIntermediary
  );

  const calculate = (rate, value, disableRounding) =>
    rate
      ? disableRounding
        ? value.times(rate)
        : value.times(rate).integerValue()
      : undefined;

  const reverse = (rate, value, disableRounding) =>
    rate
      ? disableRounding
        ? value.div(rate)
        : value.div(rate).integerValue()
      : undefined;

  const calculateSelector = createSelector(
    rateSelector,
    valueExtractor,
    disableRoundingExtractor,
    calculate
  );

  const reverseSelector = createSelector(
    rateSelector,
    valueExtractor,
    disableRoundingExtractor,
    reverse
  );

  const calculateWithIntermediarySelector = createSelector(
    rateWithIntermediarySelector,
    valueExtractor,
    disableRoundingExtractor,
    calculate
  );

  const reverseWithIntermediarySelector = createSelector(
    rateWithIntermediarySelector,
    valueExtractor,
    disableRoundingExtractor,
    reverse
  );

  // if data format changes, increment this. we don't support importing old data
  const EXPORT_VERSION = 2;

  const exportSelector = createSelector(
    storeSelector,
    pairsSelector,
    (state, pairs) => {
      const res = {
        version: EXPORT_VERSION,
        daily: {},
        hourly: {},
      };
      // filter rates to only those of interest (in current pairs)
      pairs.forEach((pair) => {
        let map = lenseRatesInMap(state.daily, pair);
        if (map) {
          putMapInRates(res.daily, pair, map);
        }
        map = lenseRatesInMap(state.hourly, pair);
        if (map) {
          putMapInRates(res.hourly, pair, map);
        }
      });
      return res;
    }
  );

  const pairsKeySelector = createSelector(pairsSelector, (pairs) =>
    pairs
      .map(
        (p) =>
          `${currencyTicker(p.from)}-${currencyTicker(p.to)}-${
            p.exchange || ""
          }`
      )
      .sort()
      .join("|")
  );

  const MAXIMUM_RATIO_EXTREME_VARIATION = 1000;

  const isCleanHistodays = (
    h: mixed,
    from: string,
    to: string,
    exchange: string
  ): boolean => {
    if (!h || typeof h !== "object") return false;
    const map = h;
    let min = Infinity;
    let max = 0;
    for (const k in map) {
      const v = map[k];
      if (typeof v !== "number") {
        return false;
      }
      min = Math.min(v, min);
      max = Math.max(v, max);
    }
    const minMaxRatio = max / min;
    const invalidRatio =
      minMaxRatio <= 0 ||
      !Number.isFinite(minMaxRatio) ||
      Number.isNaN(minMaxRatio);
    const accept =
      !invalidRatio && minMaxRatio < MAXIMUM_RATIO_EXTREME_VARIATION;
    if (!accept && log) {
      log(`invalid data detected for ${from}-${to}-${exchange}`, {
        min,
        max,
        h,
      });
    }
    return accept;
  };

  const evictBadRates = (input: mixed): RatesMap => {
    const out = {};
    if (input && typeof input === "object") {
      const rates = input;
      for (const to in rates) {
        const ratesEntry = rates[to];
        if (ratesEntry && typeof ratesEntry === "object") {
          const ratesTo = ratesEntry;
          const out2 = {};
          for (const from in ratesTo) {
            const ratesEntry2 = ratesTo[from];
            if (ratesEntry2 && typeof ratesEntry2 === "object") {
              const ratesFrom = ratesEntry2;
              const out3 = {};
              for (const exchange in ratesFrom) {
                const hist = ratesFrom[exchange];
                if (isCleanHistodays(hist, from, to, exchange)) {
                  out3[exchange] = hist;
                }
              }
              out2[from] = out3;
            }
          }
          out[to] = out2;
        }
      }
    }
    return out;
  };

  const importAction = (data: mixed) => (dispatch: Dispatch<*>) => {
    if (
      typeof data !== "object" ||
      !data ||
      typeof data.version !== "number" ||
      data.version !== EXPORT_VERSION ||
      typeof data.rates !== "object" ||
      !data.rates
    ) {
      return;
    }
    const rates = evictBadRates(data.rates);
    dispatch({ type: IMPORT, rates });
  };

  const defaultAfterPerRate = {
    daily: maximumDays
      ? formatCounterValueDay(
          new Date(Date.now() - (maximumDays + 1) * 24 * 60 * 60 * 1000)
        )
      : null,
    hourly: maxHours
      ? formatCounterValueHour(
          new Date(Date.now() - (maxHours + 1) * 60 * 60 * 1000)
        )
      : null,
  };

  const poll: Poll = () => async (dispatch, getState) => {
    const state = getState();
    const userPairs = pairsSelector(state);
    const store = storeSelector(state);

    async function run({ rate, fetch, mandatory }) {
      const pairs = [];
      const dedupKeys = {};
      userPairs.forEach((p) => {
        const fromTicker = currencyTicker(p.from);
        const toTicker = currencyTicker(p.to);
        const key = `${fromTicker}|${toTicker}|${p.exchange || ""}`;
        if (key in dedupKeys) return;
        dedupKeys[key] = 1;
        const pair: PollAPIPair = { from: fromTicker, to: toTicker };
        const defaultAfter = defaultAfterPerRate[rate];
        if (defaultAfter) {
          pair.after = defaultAfter;
        }
        if (p.exchange) {
          pair.exchange = p.exchange;
          const histodays = lenseRatesInMap(store[rate], p);
          if (histodays) {
            const keys = Object.keys(histodays)
              .filter((a) => a !== "latest")
              .sort((a, b) => (a < b ? 1 : -1));
            if (keys[0]) {
              pair.after = keys[0];
            }
          }
        }
        pairs.push(pair);
      });
      if (pairs.length === 0) return;
      log &&
        log(
          "fetch " +
            rate +
            " " +
            pairs
              .map(
                ({ from, to, exchange }) => `${from}-${to}-${exchange || ""}`
              )
              .join(" ")
        );
      const data = await fetch(getAPIBaseURL, pairs, rate).catch((e) => {
        if (mandatory) {
          throw e;
        }
        log && log("FAILED fetch " + rate + " " + String(e.message));
        return null;
      });
      return data;
    }

    const daily = await run({
      rate: "daily",
      fetch: getDailyRates,
      mandatory: true,
    });
    if (daily) {
      const ev: PollAction = { type: POLL, daily };
      dispatch(ev);
    }

    if (daily && typeof daily === "object") {
      // for pairs requested without exchanges yet OR api don't have the requested exchange,
      // we need to dispatch which exchanges was used
      // so diffing can properly work the next time
      // and asking with different exchanges will prevent to happen (over times, as arbitrary fallback can change)
      const pairsToUpdate = [];
      userPairs.forEach((pair) => {
        const { exchange } = pair;
        const toTicker = currencyTicker(pair.to);
        const fromTicker = currencyTicker(pair.from);
        const a = daily[toTicker] || {};
        if (typeof a !== "object") return;
        const b = a[fromTicker] || {};
        if (typeof b !== "object") return;
        const availableExchanges: string[] = Object.keys(b);
        const fallback = availableExchanges[0] || null;
        if (!exchange || !availableExchanges.includes(exchange)) {
          if (log)
            log(
              `${fromTicker}/${toTicker}: ${
                exchange
                  ? `exchange ${exchange} no longer in countervalue API`
                  : "no exchange defined yet"
              }. fallback to ${String(fallback)}`
            );
          pairsToUpdate.push({
            from: pair.from,
            to: pair.to,
            exchange: fallback,
          });
        }
      });
      if (pairsToUpdate.length > 0) {
        dispatch(setExchangePairsAction(pairsToUpdate));
      }
    }

    const hourly = getEnv("EXPERIMENTAL_PORTFOLIO_RANGE")
      ? await run({
          rate: "hourly",
          fetch: getHourlyRates,
          mandatory: false,
        })
      : null;

    if (hourly) {
      const ev: PollAction = { type: POLL, hourly };
      dispatch(ev);
    }
  };

  const wipe = () => ({ type: WIPE });

  const initialState: CounterValuesState = {
    daily: {},
    hourly: {},
  };

  const reducerImport = (state: CounterValuesState, action: ImportAction) => {
    return {
      daily: merge({}, state.daily, action.daily),
      hourly: merge({}, state.hourly, action.hourly),
    };
  };

  const reducerPoll = (state: CounterValuesState, action: PollAction) => {
    return {
      daily:
        action.daily && typeof action.daily === "object"
          ? merge({}, state.daily, action.daily)
          : state.daily,
      hourly:
        action.hourly && typeof action.hourly === "object"
          ? merge({}, state.hourly, action.hourly)
          : state.hourly,
    };
  };

  const reducer = (state: CounterValuesState = initialState, action) => {
    switch (action.type) {
      case IMPORT:
        return reducerImport(state, action);
      case POLL:
        return reducerPoll(state, action);
      case WIPE:
        return initialState;
      default:
        return state;
    }
  };

  const fetchExchangesForPair =
    fetchExchangesForPairImplementation ||
    (async (from, to): Promise<Exchange[]> => {
      const { data } = await network({
        method: "GET",
        url:
          getAPIBaseURL() +
          "/exchanges/" +
          currencyTicker(from) +
          "/" +
          currencyTicker(to),
      });
      invariant(
        typeof data === "object" && Array.isArray(data),
        "fetchExchangesForPair: array expected"
      );
      invariant(
        data.length === 0 ||
          (typeof data[0] === "object" && typeof data[0].id === "string"),
        "fetchExchangesForPair: array of exchanges expected"
      );
      return data;
    });

  const fetchTickersByMarketcap =
    fetchTickersByMarketcapImplementation ||
    (async (): Promise<string[]> => {
      const { data } = await network({
        method: "GET",
        url: getAPIBaseURL() + "/tickers",
      });
      invariant(
        typeof data === "object" && Array.isArray(data),
        "fetchTickersByMarketcap: array expected"
      );
      invariant(
        data.length === 0 || typeof data[0] === "string",
        "fetchTickersByMarketcap: array of strings expected"
      );
      return data;
    });

  // $FlowFixMe can't wait flow implement createContext
  const PollingContext = React.createContext(() => {});

  class Provider extends Component<PollingProviderOwnProps, Polling> {
    static defaultProps = {
      // the minimum time between two polls. to prevent spamming the API. It should not be too high otherwise the UI won't feel right (like if you have a poll button, it should poll mostly each time, unless you spam it twice in a second)
      pollThrottle: 1 * 1000,
      // the time to wait before the first poll when app starts (allow things to render to not do all at boot time)
      pollInitDelay: 1 * 1000,
      // the minimum time to wait before two automatic polls (then one that happen whatever network/appstate events)
      autopollInterval: 120 * 1000,
    };

    schedulePoll = (ms: number) => {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = setTimeout(this.poll, ms);
    };

    cancelPoll = () => {
      clearTimeout(this.pollTimeout);
    };

    poll = throttle(() => {
      // we are always scheduling the next poll() (for automatic poll mechanism)
      // this is not in a setInterval because we don't want poll() to happen too often & always will push the next automatic call as far as possible
      this.schedulePoll(this.props.autopollInterval);

      return new Promise((success) => {
        this.setState((prevState) => {
          if (prevState.pending) return null; // prevent concurrency calls.

          this.props
            .poll()
            .then(() => {
              if (this.unmounted) return;
              this.setState({ pending: false, error: null }, () => {
                success(true);
              });
            })
            .catch((error) => {
              if (this.unmounted) return;
              this.setState({ pending: false, error }, () => {
                // we don't reject the promise because we handle the error.
                success(false);
                // we want to disable next throttle because network problem
                // this gives opportunity for user to pull straight away.
                this.poll.cancel();
              });
            });
          return { pending: true, error: null };
        });
      });
    }, this.props.pollThrottle);

    wipe = () => this.props.wipe();

    state = {
      pending: false,
      poll: this.poll,
      wipe: this.wipe,
      flush: this.poll.flush,
      error: null,
    };

    pollTimeout: *;
    unmounted = false;
    stopExtraHooks: () => void;

    componentDidMount() {
      this.schedulePoll(this.props.pollInitDelay);
      this.stopExtraHooks = addExtraPollingHooks
        ? addExtraPollingHooks(this.schedulePoll, this.cancelPoll)
        : () => {};
    }

    componentDidUpdate(prevProps) {
      if (prevProps.pairsKey !== this.props.pairsKey) {
        if (log)
          log(
            `pairsKey changed:\n    ${prevProps.pairsKey}\n => ${this.props.pairsKey}`
          );
        this.poll();
      }
    }

    componentWillUnmount() {
      this.unmounted = true;
      clearTimeout(this.pollTimeout);
      this.stopExtraHooks();
    }

    render() {
      return (
        <PollingContext.Provider value={this.state}>
          {this.props.children}
        </PollingContext.Provider>
      );
    }
  }

  const PollingProvider = connect(
    createStructuredSelector({ pairsKey: pairsKeySelector }),
    { poll, wipe }
  )(Provider);

  const PollingConsumer = PollingContext.Consumer;

  return {
    calculateSelector,
    calculateWithIntermediarySelector,
    reverseSelector,
    reverseWithIntermediarySelector,
    reducer,
    PollingContext,
    PollingProvider,
    PollingConsumer,
    fetchExchangesForPair,
    fetchTickersByMarketcap,
    exportSelector,
    importAction,
  };
}

let instance: ?Module<any>;

export const implementCountervalues = <State>(input: Input<State>) => {
  instance = createCounterValues(input);
};

export const getCountervalues = () => {
  const inst = instance;
  invariant(inst, "implementCountervalues was not yet called");
  return inst;
};
