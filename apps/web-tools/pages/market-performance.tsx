import "../live-common-setup";
import React, { useMemo } from "react";
import styled from "styled-components";
import { resolveTrackingPairs } from "@ledgerhq/live-countervalues/logic";
import {
  Countervalues,
  CountervaluesMarketcap,
  MappedService,
  useCountervaluesState,
  useMappedService,
  useMarketcapIds,
  useTrackingPairsForTopCoins,
} from "@ledgerhq/live-countervalues-react";
import {
  findCryptoCurrencyById,
  findTokenById,
  getFiatCurrencyByTicker,
} from "@ledgerhq/coin-framework/currencies/index";
import { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CountervaluesSettings, TrackingPair } from "@ledgerhq/live-countervalues/types";
import {
  PerformanceMarketDatapoint,
  getPortfolioRangeConfig,
  makePerformanceMarketAssetsList,
} from "@ledgerhq/live-countervalues/portfolio";
import { PortfolioRange } from "@ledgerhq/types-live";

export const getStaticProps = async () => ({ props: {} });

const Main = styled.div`
  padding-bottom: 100px;
  margin: 20px auto;
  max-width: 600px;

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    th {
      text-align: left;
    }
    tr.unknown {
      color: #f00;
    }
    td {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    td.id {
      width: 200px;
    }
  }
`;

const Item = ({ item, i }: { item: PerformanceMarketDatapoint; i: number }) => {
  return (
    <tr className="item">
      <td className="rank">{i + 1}</td>
      <td className="name">{item.currency.name}</td>
      <td className="percentage">{(item.change * 100).toFixed(2)}%</td>
    </tr>
  );
};

const App = () => {
  const list = usePerformanceMarketAssetsList();
  return (
    <Main>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>name</th>
            <th>percentage</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item, i) => (
            <Item key={i} item={item} i={i} />
          ))}
        </tbody>
      </table>
    </Main>
  );
};

function useMarketPerformanceReferenceDate(range: PortfolioRange) {
  return useMemo(() => {
    const conf = getPortfolioRangeConfig(range);
    return conf.startOf(new Date(Date.now() - (conf.count || 0) * conf.increment));
  }, [range]);
}

function useMarketPerformanceTrackingPairs(
  countervalue: Currency,
  range: PortfolioRange,
): TrackingPair[] {
  const size = 50;
  const refDate = useMarketPerformanceReferenceDate(range);
  const marketcapIds = useMarketcapIds();
  return useTrackingPairsForTopCoins(marketcapIds, countervalue, size, refDate);
}

const countervalue = getFiatCurrencyByTicker("USD");
const range = "month";

function usePerformanceMarketAssetsList() {
  const cvsState = useCountervaluesState();
  const assets = useMarketPerformanceTrackingPairs(countervalue, range);
  const referenceDate = useMarketPerformanceReferenceDate(range);
  const mappedAssets = useMappedService();
  return useMemo(
    () =>
      makePerformanceMarketAssetsList(
        cvsState,
        countervalue,
        assets.map(a => a.from),
        mappedAssets,
        referenceDate,
      ),
    [cvsState, assets, mappedAssets, referenceDate],
  );
}

export function useUserSettings(): CountervaluesSettings {
  // countervalues for top coins (market performance feature)
  const trackingPairsForTopCoins = useMarketPerformanceTrackingPairs(countervalue, range);

  // we merge all usecases that require tracking pairs
  const trackingPairs = useMemo(
    () => resolveTrackingPairs(trackingPairsForTopCoins),
    [trackingPairsForTopCoins],
  );

  return useMemo(
    () => ({
      trackingPairs,
      autofillGaps: true,
    }),
    [trackingPairs],
  );
}

const Page = () => {
  const userSettings = useUserSettings();
  return (
    <Countervalues userSettings={userSettings}>
      <App />
    </Countervalues>
  );
};

const PageTop = () => {
  return (
    <MappedService>
      <CountervaluesMarketcap>
        <Page />
      </CountervaluesMarketcap>
    </MappedService>
  );
};

export default PageTop;
