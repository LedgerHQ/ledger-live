// @flow
import React, { Component } from "react";
import styled from "styled-components";
import { listCryptoCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/react";
import countervalues from "./countervalues";

const Section = styled.div`
  padding: 20px 40px;
`;

const SectionHeader = styled.h1``;

const CryptoList = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const CryptoCell = styled.div`
  color: ${p => p.color};
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
`;

const CryptoName = styled.div`
  padding: 6px;
  max-width: 80px;
  font-size: 12px;
  text-align: center;
`;

const AltIcon = styled.div`
  font-size: 24px;
`;

const IconWrapper = styled.div`
  color: white;
  background-color: ${p => p.color};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
`;

class Crypto extends Component<*> {
  render() {
    const { crypto } = this.props;
    const Icon = getCryptoCurrencyIcon(crypto);
    return (
      <CryptoCell color={crypto.color}>
        <IconWrapper color={crypto.color}>
          {Icon ? <Icon size={40} /> : <AltIcon>{crypto.ticker}</AltIcon>}
        </IconWrapper>
        <CryptoName>{crypto.name}</CryptoName>
      </CryptoCell>
    );
  }
}

class Currencies extends Component<*, *> {
  static demo = {
    title: "Currencies",
    url: "/currencies"
  };

  state = {
    tickers: []
  };

  async componentDidMount() {
    const tickers = await countervalues.fetchTickersByMarketcap();
    this.setState({ tickers });
  }

  render() {
    const { tickers } = this.state;
    const all = listCryptoCurrencies();
    const available = tickers
      .map(ticker => all.find(a => a.ticker === ticker))
      .filter(a => a);
    const unavailable = all.filter(a => !available.includes(a));
    return (
      <div>
        <Section>
          <SectionHeader>Crypto assets</SectionHeader>
          <CryptoList>
            {available.map(a => <Crypto crypto={a} key={a.id} />)}
          </CryptoList>
          <CryptoList>
            {unavailable.map(a => <Crypto crypto={a} key={a.id} />)}
          </CryptoList>
        </Section>
      </div>
    );
  }
}

export default Currencies;
