// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import CounterValues from "../countervalues";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/helpers/currencies";
import type { Currency } from "@ledgerhq/live-common/lib/types";

const mapStateToProps = createStructuredSelector({
  countervalue: CounterValues.calculateWithIntermediarySelector
});

class Price extends Component<{
  from: Currency,
  fromExchange: string,
  intermediary: Currency,
  toExchange: string,
  to: Currency,
  value: number,
  countervalue: ?number,
  date?: Date
}> {
  render() {
    const { to, countervalue } = this.props;
    if (!countervalue) return null;
    return (
      <span>
        <strong>
          {formatCurrencyUnit(to.units[0], countervalue, { showCode: true })}
        </strong>
      </span>
    );
  }
}

export default connect(mapStateToProps)(Price);
