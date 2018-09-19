// @flow
import { BigNumber } from "bignumber.js";
import React, { Component } from "react";
import axios from "axios";
import throttle from "lodash/throttle";
import merge from "lodash/merge";
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
  RatesMap
} from "./types";

type PollingProviderOwnProps = {
  children: React$Element<*>,
  pollThrottle: number,
  pollInitDelay: number,
  autopollInterval: number,
  poll: () => *,
  wipe: () => *,
  pairsKey: string
};

type PollAPIPair = {
  from: string,
  to: string,
  exchange?: string,
  afterDay?: string
};

const POLL = "LEDGER_CV:POLL";
const WIPE = "LEDGER_CV:WIPE";
const IMPORT = "LEDGER_CV:IMPORT";

type PollAction = {
  type: *,
  data: *
};

type ImportAction = {
  type: *,
  rates: *
};

const twoDigits = (n: number) => (n > 9 ? `${n}` : `0${n}`);

/**
 * efficient implementation of YYYY-MM-DD formatter
 * @memberof helpers/countervalue
 */
export const formatCounterValueDay = (d: Date) =>
  `${d.getFullYear()}-${twoDigits(d.getMonth() + 1)}-${twoDigits(d.getDate())}`;

function createCounterValues<State>({
  getAPIBaseURL,
  storeSelector,
  pairsSelector,
  setExchangePairsAction,
  maximumDays,
  addExtraPollingHooks,
  log
}: Input<State>): Module<State> {
  type Poll = () => (Dispatch<*>, () => State) => Promise<*>;

  const apiConfig = {
    timeout: 30000
  };

  const pairOptExchangeExtractor = (
    _store,
    { from, to, exchange }
  ): PairOptExchange => ({
    from,
    to,
    exchange
  });

  const conversionExtractor = (
    _store,
    { from, fromExchange, intermediary, toExchange, to }
  ): PairConversion => ({
    from,
    fromExchange,
    intermediary,
    toExchange,
    to
  });

  const valueExtractor = (_, { value }: { value: BigNumber }) => value;

  const disableRoundingExtractor = (
    _,
    { disableRounding }: { disableRounding?: boolean }
  ) => disableRounding;

  const dateExtractor = (_, { date }: { date?: Date }) => date;

  function lenseRatesInMap(
    rates: RatesMap,
    { from, to, exchange }
  ): ?Histodays {
    if (!exchange) return;
    const a = rates[to.ticker];
    if (!a) return;
    const b = a[from.ticker];
    if (!b) return;
    return b[exchange];
  }

  function putMapInRates(
    rates: RatesMap,
    { from, to, exchange },
    map: Histodays
  ) {
    if (!exchange) return;
    if (!rates[to.ticker]) rates[to.ticker] = {};
    const a = rates[to.ticker];
    if (!a[from.ticker]) a[from.ticker] = {};
    const b = a[from.ticker];
    b[exchange] = map;
  }

  const getRate = (store, pair, date) => {
    if (pair.from.ticker === pair.to.ticker) return 1;
    const rates = lenseRatesInMap(store.rates, pair);
    return (
      rates && ((date && rates[formatCounterValueDay(date)]) || rates.latest)
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
  const EXPORT_VERSION = 1;

  const exportSelector = createSelector(
    storeSelector,
    pairsSelector,
    (state, pairs) => {
      const res = {
        version: EXPORT_VERSION,
        rates: {}
      };
      // filter rates to only those of interest (in current pairs)
      pairs.forEach(pair => {
        const map = lenseRatesInMap(state.rates, pair);
        if (map) {
          putMapInRates(res.rates, pair, map);
        }
      });
      return res;
    }
  );

  const pairsKeySelector = createSelector(pairsSelector, pairs =>
    pairs
      .map(p => `${p.from.ticker}-${p.to.ticker}-${p.exchange || ""}`)
      .sort()
      .join("|")
  );

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
    dispatch({ type: IMPORT, rates: data.rates });
  };

  const defaultAfterDay = maximumDays
    ? formatCounterValueDay(
        new Date(Date.now() - (maximumDays + 1) * 24 * 60 * 60 * 1000)
      )
    : null;

  const poll: Poll = () => async (dispatch, getState) => {
    const state = getState();
    const userPairs = pairsSelector(state);
    const store = storeSelector(state);
    const pairs = [];
    const dedupKeys = {};
    userPairs.forEach(p => {
      const key = `${p.from.ticker}|${p.to.ticker}|${p.exchange || ""}`;
      if (key in dedupKeys) return;
      dedupKeys[key] = 1;
      const pair: PollAPIPair = { from: p.from.ticker, to: p.to.ticker };
      if (defaultAfterDay) {
        pair.afterDay = defaultAfterDay;
      }
      if (p.exchange) {
        pair.exchange = p.exchange;
        const histodays = lenseRatesInMap(store.rates, p);
        if (histodays) {
          const keys = Object.keys(histodays)
            .filter(a => a !== "latest")
            .sort((a, b) => (a < b ? 1 : -1));
          if (keys[0]) {
            pair.afterDay = keys[0];
          }
        }
      }
      pairs.push(pair);
    });
    if (pairs.length === 0) return;
    const { data }: { data: mixed } = await axios.post(
      getAPIBaseURL() + "/rates/daily",
      {
        pairs
      },
      apiConfig
    );
    if (data && typeof data === "object") {
      const ev: PollAction = { type: POLL, data };
      dispatch(ev);

      // for pairs requested without exchanges yet OR api don't have the requested exchange,
      // we need to dispatch which exchanges was used
      // so diffing can properly work the next time
      // and asking with different exchanges will prevent to happen (over times, as arbitrary fallback can change)
      const pairsToUpdate = [];
      userPairs.forEach(pair => {
        const {
          exchange,
          to: { ticker: to },
          from: { ticker: from }
        } = pair;
        const a = data[to] || {};
        if (typeof a !== "object") return;
        const b = a[from] || {};
        if (typeof b !== "object") return;
        const availableExchanges: string[] = Object.keys(b);
        const fallback = availableExchanges[0] || null;
        if (!exchange || !availableExchanges.includes(exchange)) {
          log &&
            log(
              `${from}/${to}: ${
                exchange
                  ? `exchange ${exchange} no longer in countervalue API`
                  : "no exchange defined yet"
              }. fallback to ${String(fallback)}`
            );
          pairsToUpdate.push({
            from: pair.from,
            to: pair.to,
            exchange: fallback
          });
        }
      });
      if (pairsToUpdate.length > 0) {
        dispatch(setExchangePairsAction(pairsToUpdate));
      }
    }
  };

  const wipe = () => ({ type: WIPE });

  const initialState: CounterValuesState = {
    rates: {}
  };

  const reducerImport = (state: CounterValuesState, action: ImportAction) => {
    return {
      rates: merge({}, state.rates, action.rates)
    };
  };

  const reducerPoll = (state: CounterValuesState, action: PollAction) => {
    return {
      rates: merge({}, state.rates, action.data)
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

  const fetchExchangesForPair = async (from, to): Promise<Exchange[]> => {
    const { data } = await axios.get(
      getAPIBaseURL() + "/exchanges/" + from.ticker + "/" + to.ticker,
      apiConfig
    );
    return data;
  };

  const fetchTickersByMarketcap = async (): Promise<string[]> => {
    const { data } = await axios.get(getAPIBaseURL() + "/tickers", apiConfig);
    return data;
  };

  // $FlowFixMe can't wait flow implement createContext
  const PollingContext = React.createContext(() => {});

  class Provider extends Component<PollingProviderOwnProps, Polling> {
    static defaultProps = {
      // the minimum time between two polls. to prevent spamming the API. It should not be too high otherwise the UI won't feel right (like if you have a poll button, it should poll mostly each time, unless you spam it twice in a second)
      pollThrottle: 1 * 1000,
      // the time to wait before the first poll when app starts (allow things to render to not do all at boot time)
      pollInitDelay: 1 * 1000,
      // the minimum time to wait before two automatic polls (then one that happen whatever network/appstate events)
      autopollInterval: 120 * 1000
    };

    schedulePoll = (ms: number) => {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = setTimeout(this.poll, ms);
    };

    cancelPoll = () => {
      clearTimeout(this.pollTimeout);
    };

    poll = throttle(() => {
      // we are always scheduling the next poll() (for automatic poll mecanism)
      // this is not in a setInterval because we don't want poll() to happen too often & always will push the next automatic call as far as possible
      this.schedulePoll(this.props.autopollInterval);

      return new Promise(success => {
        this.setState(prevState => {
          if (prevState.pending) return null; // prevent concurrency calls.

          this.props
            .poll()
            .then(() => {
              if (this.unmounted) return;
              this.setState({ pending: false, error: null }, () => {
                success(true);
              });
            })
            .catch(error => {
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
      error: null
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
        log &&
          log(
            `pairsKey changed:\n    ${prevProps.pairsKey}\n => ${
              this.props.pairsKey
            }`
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
    PollingProvider,
    PollingConsumer,
    fetchExchangesForPair,
    fetchTickersByMarketcap,
    exportSelector,
    importAction
  };
}

export default createCounterValues;
