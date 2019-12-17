// @flow
import React, { Component } from "react";
import { BigNumber } from "bignumber.js";
import { connect } from "react-redux";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import {
  listFiatCurrencies,
  listCryptoCurrencies,
  listTokens
} from "@ledgerhq/live-common/lib/currencies";
import { getCountervalues } from "@ledgerhq/live-common/lib/countervalues";
import CurrencySelect from "./CurrencySelect";
import ExchangeSelect from "./ExchangeSelect";
import { marketsSelector } from "../../../reducers/markets";
import { addMarket, setMarket } from "../../../actions/markets";
import Price from "./Price";
import PriceGraph from "./PriceGraph";
import ReversePrice from "./ReversePrice";
import type { Currency } from "@ledgerhq/live-common/lib/types";

const fromCurrencyList: Currency[] = listCryptoCurrencies().concat(
  listTokens()
);

const toCurrencyList: Currency[] = listCryptoCurrencies()
  .concat(listFiatCurrencies())
  .concat(listTokens());

const styles = theme => ({
  root: {
    width: "100%",
    overflowX: "auto"
  },
  flex: {
    flex: 1
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
  markets: marketsSelector(state)
});

class App extends Component<{
  markets: State,
  classes: *,
  addMarket: *,
  setMarket: *
}> {
  onChangeCVAPI = e => {
    window.LEDGER_CV_API = e.target.value;
  };
  render() {
    const { classes, markets, setMarket, addMarket } = this.props;
    const CounterValues = getCountervalues();

    return (
      <div className={classes.root}>
        <AppBar position="static">
          <CounterValues.PollingConsumer>
            {polling => (
              <Toolbar>
                <Typography
                  variant="title"
                  color="inherit"
                  className={classes.flex}
                >
                  CounterValues API demo
                </Typography>
                <TextField
                  defaultValue={window.LEDGER_CV_API}
                  onChange={this.onChangeCVAPI}
                  style={{ width: 400 }}
                />
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
              <TableCell>from currency</TableCell>
              <TableCell>to currency</TableCell>
              <TableCell>exchange</TableCell>
              <TableCell>price</TableCell>
              <TableCell>reverse price</TableCell>
              <TableCell>graph 1Y</TableCell>
              <TableCell>graph 1M</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {markets.map(({ from, to, exchange }, index) => {
              return (
                <TableRow key={index}>
                  <TableCell>
                    <CurrencySelect
                      currencies={fromCurrencyList.filter(c => c !== to)}
                      value={from}
                      onChange={from => setMarket(index, { from })}
                    />
                  </TableCell>
                  <TableCell>
                    <CurrencySelect
                      currencies={toCurrencyList.filter(c => c !== from)}
                      value={to}
                      onChange={to => setMarket(index, { to })}
                    />
                  </TableCell>
                  <TableCell>
                    {from && to ? (
                      <ExchangeSelect
                        from={from}
                        to={to}
                        value={exchange}
                        onChange={exchange => setMarket(index, { exchange })}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {from && to && exchange ? (
                      <Price
                        value={BigNumber(10 ** from.units[0].magnitude)}
                        from={from}
                        to={to}
                        exchange={exchange}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {from && to && exchange ? (
                      <ReversePrice
                        value={BigNumber(10 ** to.units[0].magnitude)}
                        from={from}
                        to={to}
                        exchange={exchange}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {from && to && exchange ? (
                      <PriceGraph
                        days={365}
                        from={from}
                        to={to}
                        exchange={exchange}
                        width={140}
                        height={50}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {from && to && exchange ? (
                      <PriceGraph
                        days={30}
                        from={from}
                        to={to}
                        exchange={exchange}
                        width={140}
                        height={50}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <footer className={classes.footer} onClick={addMarket}>
          <Button>ADD ROW</Button>
        </footer>
      </div>
    );
  }
}

export default withStyles(styles)(
  connect(
    mapStateToProps,
    { setMarket, addMarket }
  )(App)
);
