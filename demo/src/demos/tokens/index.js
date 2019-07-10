// @flow
import React, { Component, useEffect, useState } from "react";
import ReactTable from "react-table";
import uniq from "lodash/uniq";
import {
  listTokens,
  useCurrenciesByMarketcap,
  useMarketcapTickers
} from "@ledgerhq/live-common/lib/currencies";
import {
  getDailyRatesBatched,
  formatCounterValueDay
} from "@ledgerhq/live-common/lib/countervalues";

const getRates = getDailyRatesBatched(50);

const columns = [
  {
    Header: "by marketcap",
    accessor: null,
    maxWidth: 200
  },
  {
    Header: "Name",
    accessor: "name"
  },
  {
    Header: "Ticker",
    accessor: "ticker"
  },
  {
    Header: "Smart contract address",
    id: "contractAddress",
    accessor: token => (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://etherscan.io/address/${token.contractAddress}`}
      >
        {token.contractAddress}
      </a>
    )
  },
  {
    id: "countervalue",
    Header: p => {
      const data = p.data.map(d => d._original);
      const supported = data.filter(d => d.countervalueStatus === "yes");
      const withExchange = data.filter(d => d.exchange && d.ethValue);
      const percentageSupport = supported.length / data.length;
      const realPercentageSupport = withExchange.length / data.length;

      return (
        <div>
          <strong>countervalue</strong>
          <div>
            {supported.length} have marketcap (
            {Math.floor(percentageSupport * 1000) / 10}%)
          </div>
          <div>
            {withExchange.length} supported against ETH (
            {Math.floor(realPercentageSupport * 1000) / 10}%)
          </div>
        </div>
      );
    },
    accessor: token =>
      token.countervalueStatus +
      (token.countervalueStatus !== "yes"
        ? ""
        : token.loading
        ? "..."
        : token.exchange
        ? " @" +
          token.exchange +
          " Ξ" +
          token.ethValue.toLocaleString("en", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8
          })
        : " but no exchange")
  }
];

const Tokens = () => {
  const tokens = listTokens();
  const tickers = useMarketcapTickers() || [];
  const [rates, setRates] = useState({});
  const byMarketcap = useCurrenciesByMarketcap(tokens);
  const data = byMarketcap.map(t => {
    let countervalueStatus = "no";
    let loading = false;
    let exchange;
    let ethValue;
    if (t.disableCountervalue) {
      countervalueStatus = "disabled";
    } else if (tickers.includes(t.ticker)) {
      countervalueStatus = "yes";
      if (rates.ETH) {
        const ratePerExchange = (rates.ETH || {})[t.ticker] || {};
        exchange = Object.keys(ratePerExchange)[0];
        if (exchange) {
          const latest = ratePerExchange[exchange].latest || 0;
          const mul = 10 ** (t.units[0].magnitude - 18);
          ethValue = latest * mul;
        }
      } else {
        loading = true;
      }
    }
    return {
      ...t,
      countervalueStatus,
      ethValue,
      exchange,
      loading
    };
  });

  useEffect(() => {
    if (!tickers) return;
    getRates(
      () => window.LEDGER_CV_API,
      uniq(tickers)
        .filter(ticker => tokens.some(t => t.ticker === ticker))
        .map(from => ({
          from,
          to: "ETH",
          afterDay: formatCounterValueDay(new Date())
        }))
    ).then(setRates);
  }, [tickers, tokens]);

  return (
    <div
      style={{
        boxSizing: "border-box",
        height: "100vh",
        display: "flex"
      }}
    >
      <ReactTable
        style={{ flex: 1 }}
        showPagination={false}
        showPaginationBottom={false}
        defaultPageSize={-1}
        data={data}
        columns={columns}
        filterable
      />
    </div>
  );
};

export default class Demo extends Component<{}> {
  static demo = {
    title: "Tokens",
    url: "/Tokens"
  };
  render() {
    return <Tokens />;
  }
}
