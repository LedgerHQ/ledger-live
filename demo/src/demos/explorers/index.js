// @flow
import React, { PureComponent, Component } from "react";
import styled from "styled-components";
import { format as timeago } from "timeago.js";
import { listCryptoCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/react";

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

const getMillisSinceBlock = async ({ ledgerExplorerId }) => {
  const url = `//api.ledgerwallet.com/blockchain/v2/${ledgerExplorerId}/blocks/current`;
  const r = await fetch(url);
  if (r.status !== 200) throw new Error("HTTP " + r.status);
  const json = await r.json();
  if (typeof json !== "object" || !json || typeof json.time !== "string") {
    throw new Error("Invalid blocks/current");
  }
  return { time: json.time, millis: new Date() - new Date(json.time) };
};

class TimeState extends PureComponent<*, *> {
  render() {
    const { time, error } = this.props;
    const loading = time.millis === 0;
    const hasError = !!error || time.millis > 60 * 60 * 1000;
    return (
      <TimeContainer title={time.time} loading={loading} hasError={hasError}>
        {loading
          ? "..."
          : hasError
            ? error
              ? error.message
              : timeago(time.time)
            : "OK"}
      </TimeContainer>
    );
  }
}

class ExplorerRow extends PureComponent<*, *> {
  state = {
    times: Array(5).fill({ error: null, time: 0 })
  };

  async componentDidMount() {
    const { currency } = this.props;
    for (let i = 0; i < 5; i++) {
      let time = 0;
      let error = null;
      try {
        time = await getMillisSinceBlock(currency);
      } catch (e) {
        error = e;
      }
      this.setState(({ times }) => ({
        times: times.map((v, index) => (i === index ? { time, error } : v))
      }));
    }
  }
  render() {
    const { currency } = this.props;
    const Icon = getCryptoCurrencyIcon(currency);

    return (
      <Row>
        <IconWrapper size={60} bg={currency.color} color="white">
          {Icon ? <Icon size={30} /> : <AltIcon>{currency.ticker}</AltIcon>}
        </IconWrapper>
        <CryptoName>{currency.ledgerExplorerId}</CryptoName>
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
    const coins = listCryptoCurrencies();
    return (
      <Main>
        {coins.filter(c => c.ledgerExplorerId).map(c => (
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
