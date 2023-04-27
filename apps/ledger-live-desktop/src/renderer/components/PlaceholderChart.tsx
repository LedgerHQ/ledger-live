import React, { Component } from "react";
import Chart from "~/renderer/components/Chart";
import { DefaultTheme, withTheme } from "styled-components";
import { Data, Item } from "./Chart/types";
import { PortfolioRange } from "@ledgerhq/types-live";

type Props = {
  data: Data;
  tickXScale: PortfolioRange;
  theme: DefaultTheme;
  magnitude: number;
};

class PlaceholderChart extends Component<Props> {
  shouldComponentUpdate(next: Props) {
    return next.tickXScale !== this.props.tickXScale;
  }

  render() {
    const { data, tickXScale, theme } = this.props;
    const themeType = theme.colors.palette.type;
    const mappedData: Data = data.map((i: Item) => {
      const date = i.date.getTime();
      return {
        ...i,
        // general curve trend
        value:
          10000 *
          (1 +
            0.1 * Math.sin(date * Math.cos(date)) +
            // random-ish
            0.5 * Math.cos(date / 2000000000 + Math.sin(date / 1000000000))),
      };
    });
    return (
      <Chart
        color={themeType === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
        data={mappedData}
        height={200}
        tickXScale={tickXScale}
        renderTickY={() => ""}
        magnitude={this.props.magnitude}
      />
    );
  }
}
export default withTheme(PlaceholderChart);
