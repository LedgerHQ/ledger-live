// @flow
import React, { useState, useEffect } from "react";
import {
  listSupportedCurrencies,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/lib/currencies";
import type {
  CountervaluesSettings,
  TrackingPair,
} from "@ledgerhq/live-common/lib/countervalues/types";
import { importCountervalues } from "@ledgerhq/live-common/lib/countervalues/logic";
import {
  Countervalues,
  useCountervaluesPolling,
  useCountervaluesExport,
} from "@ledgerhq/live-common/lib/countervalues/react";
import CurrentRate from "./CurrentRate";
import GraphRate from "./GraphRate";

const Row = ({ pair }: { pair: TrackingPair }) => {
  return (
    <div>
      {" 1Y"}
      <GraphRate
        from={pair.from}
        to={pair.to}
        count={50}
        increment={7 * 24 * 60 * 60 * 1000}
        width={120}
        height={60}
      />
      {" 1M"}
      <GraphRate
        from={pair.from}
        to={pair.to}
        count={30}
        increment={24 * 60 * 60 * 1000}
        width={120}
        height={60}
      />
      {" 7D"}
      <GraphRate
        from={pair.from}
        to={pair.to}
        count={7 * 24}
        increment={60 * 60 * 1000}
        width={120}
        height={60}
      />
      {" 1D"}
      <GraphRate
        from={pair.from}
        to={pair.to}
        count={24}
        increment={60 * 60 * 1000}
        width={120}
        height={60}
      />
      <CurrentRate from={pair.from} to={pair.to} />
    </div>
  );
};

const App = ({ userSettings }: { userSettings: CountervaluesSettings }) => {
  const polling = useCountervaluesPolling();
  return (
    <div>
      <header>
        <span>{polling.pending ? "loading..." : "loaded."}</span>
        <button onClick={polling.wipe}>Wipe</button>
        <button onClick={polling.poll}>Poll</button>
      </header>
      <div>
        {userSettings.trackingPairs.map((pair) => (
          <Row key={pair.from.ticker + "_" + pair.to.ticker} pair={pair} />
        ))}
      </div>
    </div>
  );
};

const initialUserSettings = {
  // TODO we could make this dynamic / saved in LocalStorage
  trackingPairs: listSupportedCurrencies()
    .filter((c) => !c.isTestnetFor)
    .map((from) => ({
      from,
      // this to be dynamical (actually let user conf the from-to)
      to: getFiatCurrencyByTicker("USD"),
      // this to be dynamical (we want to challenge change of this over time!)
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    })),
  autofillGaps: true,
};

const LS_KEY = "countervalues";
let initialCountervalues;
try {
  const json = localStorage.getItem(LS_KEY);
  if (json) {
    initialCountervalues = importCountervalues(
      JSON.parse(json),
      initialUserSettings
    );
  }
} catch (e) {
  console.warn(e);
}

const HookChanges = () => {
  const e = useCountervaluesExport();
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(e));
  }, [e]);
  return null;
};

const Demo = () => {
  const [userSettings, setUserSettings] = useState(initialUserSettings);

  return (
    <Countervalues
      initialCountervalues={initialCountervalues}
      userSettings={userSettings}
    >
      <HookChanges />
      <App userSettings={userSettings} setUserSettings={setUserSettings} />
    </Countervalues>
  );
};

Demo.demo = {
  title: "Countervalues",
  url: "/countervalues",
};

export default Demo;
