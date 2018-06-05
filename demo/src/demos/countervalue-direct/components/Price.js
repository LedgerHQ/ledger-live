// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import CounterValues from "../countervalues";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/helpers/currencies";
import type { Currency } from "@ledgerhq/live-common/lib/types";

const mapStateToProps = createStructuredSelector({
  countervalue: CounterValues.calculateSelector
});

class Price extends Component<{
  from: Currency,
  to: Currency,
  exchange: string,
  value: number,
  countervalue: ?number,
  date?: Date
}> {
  render() {
    const { from, to, value, countervalue } = this.props;
    if (!countervalue) return null;
    return (
      <span>
        <strong>
          {formatCurrencyUnit(from.units[0], value, { showCode: true })}
        </strong>
        {" = "}
        <strong>
          {formatCurrencyUnit(to.units[0], countervalue, { showCode: true })}
        </strong>
      </span>
    );
  }
}

export default connect(mapStateToProps)(Price);
