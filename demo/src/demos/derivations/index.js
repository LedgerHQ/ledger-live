// @flow
import React, { Component } from "react";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import styled from "styled-components";
import { listCryptoCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { getAccountPlaceholderName } from "@ledgerhq/live-common/lib/account";
import getAddress, { perFamily } from "@ledgerhq/live-common/lib/hw/getAddress";
import {
  getDerivationModesForCurrency,
  getDerivationScheme,
  runDerivationScheme
} from "@ledgerhq/live-common/lib/derivation";
import CurrencySelect from "./CurrencySelect";

const Main = styled.div`
  padding: 40px;
`;

let queue = Promise.resolve();
const execInQueue = <T>(job: () => Promise<T>) => {
  const p = queue.then(job);
  queue = p;
  return queue;
};

class CurrencyDerivation extends Component<*, *> {
  state = {
    address: "",
    path: "",
    error: null
  };

  componentDidMount() {
    this.getAddress();
  }

  getAddress = (verify: boolean = false) =>
    execInQueue(async () => {
      const { derivationMode, currency, account } = this.props;
      try {
        const transport = await TransportU2F.create();
        const { address, path } = await getAddress(
          transport,
          currency,
          runDerivationScheme(
            getDerivationScheme({ currency, derivationMode }),
            currency,
            { account }
          ),
          verify
        );
        this.setState({ address, path });
      } catch (error) {
        this.setState({ error });
      }
    });

  onVerify = () => this.getAddress(true);

  render() {
    const { currency, derivationMode, index } = this.props;
    const { address, path, error } = this.state;

    return (
      <div style={{ padding: "5px 0" }}>
        <strong
          style={{ margin: "0 5px", width: 300, display: "inline-block" }}
        >
          {getAccountPlaceholderName({ currency, derivationMode, index })}
        </strong>
        {error ? (
          <code style={{ color: "#C30", fontSize: "10px" }}>
            {String(error.message || error)}
            <button onClick={this.onVerify}>verify</button>
          </code>
        ) : path ? (
          <span>
            <code style={{ color: "#333", padding: "0 5px" }}>
              {`${path}: ${address}`}
            </code>
            <button onClick={this.onVerify}>verify</button>
          </span>
        ) : null}
      </div>
    );
  }
}

class CurrencyDerivations extends Component<*, *> {
  state = {
    total: 1
  };

  more = () => this.setState(({ total }) => ({ total: total + 1 }));

  render() {
    const { currency } = this.props;
    const { total } = this.state;

    return (
      <div>
        {Array(total)
          .fill(null)
          .map((_, index) =>
            getDerivationModesForCurrency(currency).map(derivationMode => (
              <CurrencyDerivation
                key={derivationMode}
                currency={currency}
                derivationMode={derivationMode}
                index={index}
              />
            ))
          )}
        <button onClick={this.more}>MORE</button>
      </div>
    );
  }
}

class Derivations extends Component<*, *> {
  static demo = {
    title: "Derivations",
    url: "/derivations"
  };

  state = {
    currency: null
  };

  onChangeCurrency = (currency: *) => {
    this.setState({ currency });
  };

  render() {
    const { currency } = this.state;
    const currencies = listCryptoCurrencies(true)
      .filter(a => perFamily[a.family])
      .sort(
        (a, b) =>
          a.family === b.family
            ? a.name.localeCompare(b.name)
            : a.family.localeCompare(b.family)
      );
    return (
      <Main>
        <div style={{ textAlign: "center" }}>
          <CurrencySelect
            currencies={currencies}
            value={currency}
            onChange={this.onChangeCurrency}
          />
        </div>
        {currency ? (
          <CurrencyDerivations currency={currency} key={currency.id} />
        ) : null}
      </Main>
    );
  }
}

export default Derivations;
