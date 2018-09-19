// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import { BigNumber } from "bignumber.js";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from "material-ui/Table";
import TextField from "material-ui/TextField";
import { withStyles } from "material-ui/styles";
import AppBar from "material-ui/AppBar";
import Toolbar from "material-ui/Toolbar";
import Button from "material-ui/Button";
import { CircularProgress } from "material-ui/Progress";
import Typography from "material-ui/Typography";
import {
  listFiatCurrencies,
  listCryptoCurrencies
} from "@ledgerhq/live-common/lib/helpers/currencies";
import CurrencySelect from "./CurrencySelect";
import ExchangeSelect from "./ExchangeSelect";
import { appSelector } from "../reducers/app";
import {
  addRow,
  setRow,
  setCountervalueCurrency,
  setCountervalueExchange
} from "../actions/app";
import Price from "./Price";
import type { State } from "../reducers/app";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import CounterValues from "../countervalues";

const cryptos: Currency[] = listCryptoCurrencies(true);
const fiats: Currency[] = listFiatCurrencies();

const styles = theme => ({
  root: {
    width: "100%",
    overflowX: "auto"
  },
  head: {
    flex: 1,
    textAlign: "center"
  },
  table: {
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3
  },
  footer: {
    display: "flex",
    justifyContent: "center"
  }
});

const mapStateToProps = state => ({
  app: appSelector(state)
});

class App extends Component<{
  app: State,
  classes: *,
  addRow: *,
  setRow: *,
  setCountervalueCurrency: *,
  setCountervalueExchange: *
}> {
  render() {
    const {
      classes,
      app,
      setRow,
      addRow,
      setCountervalueCurrency,
      setCountervalueExchange
    } = this.props;
    return (
      <div className={classes.root}>
        <AppBar position="static">
          <CounterValues.PollingConsumer>
            {polling => (
              <Toolbar>
                <Typography variant="title" color="inherit">
                  CounterValues API demo
                </Typography>
                <div className={classes.head}>
                  <CurrencySelect
                    currencies={fiats}
                    value={app.countervalueCurrency}
                    onChange={setCountervalueCurrency}
                  />
                  <ExchangeSelect
                    from={app.intermediaryCurrency}
                    to={app.countervalueCurrency}
                    value={app.countervalueExchange}
                    onChange={setCountervalueExchange}
                  />
                </div>
                <Button onClick={polling.wipe} color="inherit">
                  Wipe
                </Button>
                <Button
                  onClick={polling.poll}
                  color="inherit"
                  style={{ opacity: polling.pending ? 0.5 : 1 }}
                >
                  Poll
                </Button>
                <CircularProgress
                  color="inherit"
                  size={20}
                  style={{
                    opacity: !polling.pending ? 0 : 1,
                    marginLeft: 8,
                    marginRight: -12
                  }}
                />
              </Toolbar>
            )}
          </CounterValues.PollingConsumer>
        </AppBar>

        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>currency</TableCell>
              <TableCell>exchange</TableCell>
              <TableCell>value</TableCell>
              <TableCell>countervalue</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {app.rows.map(({ currency, exchange, value }, index) => {
              return (
                <TableRow key={index}>
                  <TableCell>
                    <CurrencySelect
                      currencies={cryptos}
                      value={currency}
                      onChange={currency => setRow(index, { currency })}
                    />
                  </TableCell>
                  <TableCell>
                    {currency ? (
                      <ExchangeSelect
                        from={currency}
                        to={app.intermediaryCurrency}
                        value={exchange}
                        onChange={exchange => setRow(index, { exchange })}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={value}
                      onChange={e => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && isFinite(value)) {
                          setRow(index, { value });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {currency ? (
                      <Price
                        value={BigNumber(
                          Math.round(value * 10 ** currency.units[0].magnitude)
                        )}
                        from={currency}
                        fromExchange={exchange}
                        intermediary={app.intermediaryCurrency}
                        toExchange={app.countervalueExchange}
                        to={app.countervalueCurrency}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <footer className={classes.footer} onClick={addRow}>
          <Button>ADD ROW</Button>
        </footer>
      </div>
    );
  }
}

export default withStyles(styles)(
  connect(
    mapStateToProps,
    { setRow, addRow, setCountervalueCurrency, setCountervalueExchange }
  )(App)
);
