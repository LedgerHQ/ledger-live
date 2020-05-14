// @flow
import React, { PureComponent, Component } from "react";
import styled from "styled-components";
import { format as timeago } from "timeago.js";
import { listCryptoCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/react";
import {
  blockchainBaseURL,
  getCurrencyExplorer,
  hasCurrencyExplorer
} from "@ledgerhq/live-common/lib/api/Ledger";

const Main = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Row = styled.div`
  margin: 4px;
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const AltIcon = styled.div`
  font-size: 24px;
`;

const IconWrapper = styled.div`
  color: ${p => p.color};
  background-color: ${p => p.bg};
  border-radius: 8px;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: ${p => p.size}px;
  height: ${p => p.size}px;
  margin-right: 10px;
`;

const CryptoName = styled.div`
  padding: 6px;
  font-size: 16px;
  font-weight: bold;
`;

const TimeContainer = styled.div`
  width: 50px;
  height: 50px;
  background-color: ${p =>
    p.loading ? "#999" : !p.hasError ? "#0F0" : "#F00"};
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12px;
`;

const Checks = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  justify-content: flex-end;
`;

const checkCoinExplorer = async currency => {
  const url = `${blockchainBaseURL(currency)}/blocks/current`;
  const r = await fetch(url);
  if (r.status !== 200) {
    throw new Error("HTTP " + r.status);
  }
  const json = await r.json();
  if (typeof json !== "object" || !json || typeof json.time !== "string") {
    throw new Error("Invalid blocks/current");
  }
  if (new Date() - new Date(json.time) > 60 * 60 * 1000) {
    throw new Error("outdated " + timeago(json.time));
  }
};

class TimeState extends PureComponent<*, *> {
  render() {
    const { loading, error } = this.props;
    return (
      <TimeContainer loading={loading} hasError={!!error}>
        {loading ? "..." : error ? error.message : "OK"}
      </TimeContainer>
    );
  }
}

class ExplorerRow extends PureComponent<*, *> {
  state = {
    times: Array(5).fill({ error: null, loading: true })
  };

  async componentDidMount() {
    const { currency } = this.props;
    for (let i = 0; i < 5; i++) {
      let error = null;
      try {
        await checkCoinExplorer(currency);
      } catch (e) {
        error = e;
      }
      this.setState(({ times }) => ({
        times: times.map((v, index) =>
          i === index ? { loading: false, error } : v
        )
      }));
    }
  }
  render() {
    const { currency } = this.props;
    const Icon = getCryptoCurrencyIcon(currency);
    const info = getCurrencyExplorer(currency);

    return (
      <Row>
        <IconWrapper size={60} bg={currency.color} color="white">
          {Icon ? <Icon size={30} /> : <AltIcon>{currency.ticker}</AltIcon>}
        </IconWrapper>
        <CryptoName>
          {info.version} {info.id}
        </CryptoName>
        <Checks>
          {this.state.times.map(({ time, error }, i) => (
            <TimeState key={i} time={time} error={error} />
          ))}
        </Checks>
      </Row>
    );
  }
}

class Explorers extends Component<*> {
  render() {
    const coins = listCryptoCurrencies(true);
    return (
      <Main>
        <h1 style={{ color: "red" }}>Are you still using this page? Please contact @gre. We are about to disrupt it. We no longer support this, https://github.com/LedgerHQ/ledger-live-common and INFRA team have enough tests to cover this.</h1>
        {coins
          .filter(c => hasCurrencyExplorer(c))
          .map(c => (
            <ExplorerRow currency={c} key={c.id} />
          ))}
      </Main>
    );
  }
}

// $FlowFixMe
Explorers.demo = {
  title: "Explorers",
  url: "/explorers",
  hidden: true
};

export default Explorers;
