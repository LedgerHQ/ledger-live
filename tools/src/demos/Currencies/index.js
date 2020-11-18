// @flow
import React, { Component } from "react";
import styled from "styled-components";
import { listCryptoCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/react";
import {
  blockchainBaseURL,
  hasCurrencyExplorer,
} from "@ledgerhq/live-common/lib/api/Ledger";
import api from "@ledgerhq/live-common/lib/countervalues/api";

const Section = styled.div`
  padding: 20px 40px;
`;

const Intro = styled.div`
  margin-top: 20px;
  padding: 0 40px;
  font-size: 16px;
`;

const SectionHeader = styled.h1``;

const CryptoList = styled.div`
  display: flex;
  flex-direction: column;
`;

const CryptoCell = styled.div`
  color: ${(p) => p.color};
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 10px;
`;

const Problem = styled.div`
  width: 50px;
  color: red;
  text-decoration: underline;
`;
const NoProblem = styled.div`
  width: 50px;
  color: green;
`;

const CryptoName = styled.div`
  padding: 6px;
  font-size: 14px;
`;

const CryptoInfo = styled.div`
  padding: 6px;
  font-size: 14px;
  color: #999;
  flex: 1;
`;

const AltIcon = styled.div`
  font-size: 24px;
`;

const IconWrapper = styled.div`
  color: ${(p) => p.color};
  background-color: ${(p) => p.bg};
  border-radius: 8px;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
  margin-right: 10px;
`;

class Crypto extends Component<*> {
  render() {
    const { crypto } = this.props;
    const Icon = getCryptoCurrencyIcon(crypto);
    const validationErrors = [
      Icon ? null : "icon is missing",
      crypto.family === "bitcoin" && !crypto.bitcoinLikeInfo
        ? "bitcoin family coins must provide bitcoinLikeInfo"
        : null,
      crypto.family === "ethereum" && !crypto.ethereumLikeInfo
        ? "ethereum family coins must provide ethereumLikeInfo"
        : null,
      crypto.units.length === 0
        ? "at least one unit must be provided in units"
        : null,
    ].filter((o) => o);
    return (
      <CryptoCell color={crypto.color}>
        {validationErrors.length ? (
          <Problem title={validationErrors.join("\n")}>KO</Problem>
        ) : (
          <NoProblem>OK</NoProblem>
        )}
        <IconWrapper size={60} bg={crypto.color} color="white">
          {Icon ? <Icon size={30} /> : <AltIcon>{crypto.ticker}</AltIcon>}
        </IconWrapper>
        <IconWrapper size={60} color={crypto.color} bg="white">
          {Icon ? <Icon size={30} /> : <AltIcon>{crypto.ticker}</AltIcon>}
        </IconWrapper>
        <CryptoName>
          {crypto.name} ({crypto.ticker})
        </CryptoName>
        <CryptoInfo>
          {[
            "#" + crypto.id + "(" + crypto.coinType + ")",
            "belongs to " + crypto.family + " family",
            crypto.isTestnetFor &&
              "is testnet of '" + crypto.isTestnetFor + "'",
            crypto.supportsSegwit && "supports segwit",
            crypto.forkedFrom && "forked " + crypto.forkedFrom,
            crypto.managerAppName &&
              "on Manager '" + crypto.managerAppName + "'",
            crypto.ledgerExplorerId &&
              "ledger explorer '" + crypto.ledgerExplorerId + "'",
            crypto.blockAvgTime && "blockAvgTime=" + crypto.blockAvgTime,
            crypto.scheme && "scheme=" + crypto.scheme,
            crypto.bitcoinLikeInfo &&
              "bitcoinLikeInfo=" + JSON.stringify(crypto.bitcoinLikeInfo),
            crypto.ethereumLikeInfo &&
              "ethereumLikeInfo=" + JSON.stringify(crypto.ethereumLikeInfo),
            "units are " +
              crypto.units
                .map((u) => u.code + "(^" + u.magnitude + ")")
                .join(" "),
            hasCurrencyExplorer(crypto)
              ? "ledger explorer is " + blockchainBaseURL(crypto)
              : "doesn't have ledger explorer",
          ]
            .filter((o) => o)
            .join(", ")}
        </CryptoInfo>
      </CryptoCell>
    );
  }
}

class Currencies extends Component<*, *> {
  static demo = {
    title: "Currencies",
    url: "/currencies",
  };

  state = {
    tickers: [],
  };

  async componentDidMount() {
    const tickers = await api.fetchMarketcapTickers();
    this.setState({ tickers });
  }

  render() {
    const { tickers } = this.state;
    const all = listCryptoCurrencies(true);
    const available = tickers
      .map((ticker) => all.find((a) => a.ticker === ticker))
      .filter(Boolean);
    const unavailable = all.filter((a) => !available.includes(a));
    return (
      <div>
        <Intro>
          This shows <code>@ledgerhq/live-common</code> database (Disclaimer:
          regardless if a given crypto-asset is supported)
        </Intro>
        <Section>
          <SectionHeader>Crypto assets</SectionHeader>
          <CryptoList>
            {available.map((a) => (
              <Crypto crypto={a} key={a.id} />
            ))}
          </CryptoList>
          <SectionHeader>no countervalues yet</SectionHeader>
          <CryptoList>
            {unavailable.map((a) => (
              <Crypto crypto={a} key={a.id} />
            ))}
          </CryptoList>
        </Section>
      </div>
    );
  }
}

export default Currencies;
