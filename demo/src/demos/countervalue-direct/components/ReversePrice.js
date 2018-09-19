// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import type BigNumber from "bignumber.js";
import { createStructuredSelector } from "reselect";
import CounterValues from "../countervalues";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/helpers/currencies";
import type { Currency } from "@ledgerhq/live-common/lib/types";

const mapStateToProps = createStructuredSelector({
  reversed: CounterValues.reverseSelector
});

class ReversePrice extends Component<{
  from: Currency,
  to: Currency,
  exchange: string,
  value: BigNumber,
  reversed: ?BigNumber,
  date?: Date
}> {
  render() {
    const { from, to, value, reversed } = this.props;
    if (!reversed) return null;
    return (
      <span>
        <strong>
          {formatCurrencyUnit(to.units[0], value, { showCode: true })}
        </strong>
        {" = "}
        <strong>
          {formatCurrencyUnit(from.units[0], reversed, { showCode: true })}
        </strong>
      </span>
    );
  }
}

export default connect(mapStateToProps)(ReversePrice);
