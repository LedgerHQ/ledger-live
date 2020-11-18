// @flow
import React, { Component, useCallback, useState, useMemo } from "react";
import ReactTable from "react-table";
import { BigNumber } from "bignumber.js";
import {
  listTokens,
  listCryptoCurrencies,
  isCurrencySupported,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
  useCurrenciesByMarketcap,
  useMarketcapTickers,
  formatCurrencyUnit,
} from "@ledgerhq/live-common/lib/currencies";

const usdFiat = getFiatCurrencyByTicker("USD");
const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

const DownloadData = ({ data }) => {
  const onClick = useCallback(() => {
    const csv = [
      ["id", "name", "ticker", "type", "live", "url", "USD", "magnitude"],
    ]
      .concat(
        data.map((d) => [
          d.id,
          d.name,
          d.ticker,
          d.type,
          d.livesupport,
          d.type === "TokenCurrency"
            ? `https://etherscan.io/address/${d.contractAddress}`
            : "",
          d.usdValue,
          d.units[0].magnitude,
        ])
      )
      .map((row) =>
        row.map((cell) => String(cell).replace(/[,\n\r]/g, "")).join(",")
      )
      .join("\n");
    const dataUrl = `data:text/csv,` + encodeURIComponent(csv);
    window.open(dataUrl);
  }, [data]);

  return <button onClick={onClick}>CSV</button>;
};

const columns = [
  {
    Header: "Live?",
    width: 80,
    accessor: "livesupport",
  },
  {
    Header: "Delisted?",
    width: 80,
    accessor: "delisted",
  },
  {
    Header: "type",
    width: 120,
    accessor: "typeText",
  },
  {
    Header: "id",
    width: 120,
    accessor: "id",
  },
  {
    Header: "Name",
    accessor: "name",
  },
  {
    Header: "Ticker",
    accessor: "ticker",
    width: 100,
  },
  {
    Header: "Magnitude",
    id: "magnitude",
    accessor: (o) => o.units[0].magnitude,
    width: 100,
  },
  {
    Header: "extra",
    id: "extra",
    accessor: (token) =>
      token.type === "TokenCurrency" ? (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`https://etherscan.io/address/${token.contractAddress}`}
        >
          {token.contractAddress}
        </a>
      ) : (
        "coinType=" + token.coinType
      ),
  },
  {
    id: "countervalue",
    Header: (p) => {
      const data = p.data.map((d) => d._original);
      const supported = data.filter((d) => d.countervalueStatus === "yes");
      const withExchange = data.filter((d) => d.exchange);
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
            {withExchange.length} supported (
            {Math.floor(realPercentageSupport * 1000) / 10}%)
          </div>
          <DownloadData data={data} />
        </div>
      );
    },
    accessor: "countervalueText",
  },
  {
    Header: "USD",
    accessor: "usdValue",
    width: 100,
  },
];

const counterpartFor = (c) =>
  c === bitcoin || c === ethereum
    ? usdFiat
    : c.type === "CryptoCurrency"
    ? bitcoin
    : ethereum;

const Assets = () => {
  const tokens = listTokens({ withDelisted: true });
  const currencies = listCryptoCurrencies();
  const all = useMemo(() => currencies.concat(tokens), [tokens, currencies]);
  const tickers = useMarketcapTickers() || [];
  const [rates] = useState({});
  const byMarketcap = useCurrenciesByMarketcap(all);
  const data = byMarketcap.map((t) => {
    let countervalueStatus = "no";
    let loading = false;
    let exchange;
    let formatted = "";
    let usdValue = "";
    if (t.disableCountervalue) {
      countervalueStatus = "disabled";
    } else if (tickers.includes(t.ticker)) {
      countervalueStatus = "yes";
      const counter = counterpartFor(t);
      if (rates[counter.ticker]) {
        const ratePerExchange = (rates[counter.ticker] || {})[t.ticker] || {};
        exchange = Object.keys(ratePerExchange)[0];
        if (exchange) {
          const latest = ratePerExchange[exchange].latest || 0;

          if (counter !== usdFiat) {
            if (rates[usdFiat.ticker]) {
              const intermRatePerExchange =
                (rates[usdFiat.ticker] || {})[counter.ticker] || {};
              const intermExchange = Object.keys(intermRatePerExchange)[0];
              if (intermExchange) {
                const intermLatest =
                  intermRatePerExchange[intermExchange].latest || 0;
                usdValue = formatCurrencyUnit(
                  usdFiat.units[0],
                  BigNumber(latest)
                    .times(intermLatest)
                    .times(10 ** t.units[0].magnitude)
                );
              }
            }
          } else {
            usdValue = formatCurrencyUnit(
              counter.units[0],
              BigNumber(latest).times(10 ** t.units[0].magnitude)
            );
          }

          formatted = formatCurrencyUnit(
            counter.units[0],
            BigNumber(latest).times(10 ** t.units[0].magnitude),
            {
              showCode: true,
            }
          );
        }
      } else {
        loading = true;
      }
    }
    const countervalueText =
      countervalueStatus !== "yes"
        ? countervalueStatus
        : loading
        ? "..."
        : exchange
        ? exchange + " @ " + formatted
        : "no exchange found";
    const livesupport =
      t.type === "TokenCurrency" || isCurrencySupported(t) ? "yes" : "no";
    return {
      ...t,
      typeText:
        t.type === "TokenCurrency"
          ? "token on " + t.parentCurrency.name
          : "coin",
      countervalueStatus,
      countervalueText,
      exchange,
      loading,
      livesupport,
      delisted: t.delisted ? "yes" : "no",
      usdValue,
    };
  });

  return (
    <div
      style={{
        boxSizing: "border-box",
        height: "100vh",
        display: "flex",
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
    title: "Assets",
    url: "/assets",
  };
  render() {
    return <Assets />;
  }
}
