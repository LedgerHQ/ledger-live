// @flow
import React, { Component } from "react";
import { MenuItem } from "material-ui/Menu";
import Select from "material-ui/Select";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/react";
import type { Currency, CryptoCurrency } from "@ledgerhq/live-common/lib/types";

function inferCrypto(currency: Currency): ?CryptoCurrency {
  if ("id" in currency) {
    // $FlowFixMe not sure how to address this properly
    return currency;
  }
}

class CurrencySelect extends Component<{
  value: ?Currency,
  currencies: Currency[],
  onChange: (?Currency) => void
}> {
  handleChange = (e: *) => {
    this.props.onChange(this.props.currencies[e.target.value]);
  };
  render() {
    const { currencies, value, ...rest } = this.props;
    const i = currencies.indexOf(value);
    return (
      <Select {...rest} value={i} onChange={this.handleChange}>
        <MenuItem value={-1}>
          <em>None</em>
        </MenuItem>
        {currencies.map((c, i) => {
          const maybeCrypto = inferCrypto(c);
          if (maybeCrypto) {
            const Icon = getCryptoCurrencyIcon(maybeCrypto);
            return (
              <MenuItem key={i} value={i}>
                {Icon ? (
                  <span style={{ marginRight: 8 }}>
                    <Icon size={16} color={maybeCrypto.color} />
                  </span>
                ) : null}
                {c.name} ({c.ticker})
              </MenuItem>
            );
          } else {
            return (
              <MenuItem key={i} value={i}>
                {c.name} ({c.ticker})
              </MenuItem>
            );
          }
        })}
      </Select>
    );
  }
}

export default CurrencySelect;
