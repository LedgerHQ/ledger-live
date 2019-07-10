// @flow
import React, { Component } from "react";
import ReactTable from "react-table";
import {
  listTokens,
  useCurrenciesByMarketcap,
  useMarketcapTickers
} from "@ledgerhq/live-common/lib/currencies";

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
    Header: "countervalue supported",
    maxWidth: 200,
    accessor: "countervalueStatus"
  }
];

const Tokens = () => {
  const tokens = listTokens();
  const tickers = useMarketcapTickers() || [];
  const byMarketcap = useCurrenciesByMarketcap(tokens);
  const data = byMarketcap.map(t => ({
    ...t,
    countervalueStatus: t.disableCountervalue
      ? "disabled"
      : tickers.includes(t.ticker)
      ? "yes"
      : "no"
  }));
  return (
    <ReactTable
      showPagination={false}
      showPaginationBottom={false}
      defaultPageSize={-1}
      data={data}
      columns={columns}
    />
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
