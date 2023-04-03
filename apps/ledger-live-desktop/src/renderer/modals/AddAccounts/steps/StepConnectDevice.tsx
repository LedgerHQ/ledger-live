import invariant from "invariant";
import React, { useEffect } from "react";
import { prepareCurrency } from "~/renderer/bridge/cache";
import TrackPage from "~/renderer/analytics/TrackPage";
import DeviceAction from "~/renderer/components/DeviceAction";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import { StepProps } from "..";
import { getEnv } from "@ledgerhq/live-common/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);
const StepConnectDevice = ({ currency, device, transitionTo, flow }: StepProps) => {
  invariant(currency, "No crypto asset given");

  // preload currency ahead of time
  useEffect(() => {
    if (currency && currency.type === "CryptoCurrency") {
      prepareCurrency(currency);
    }
  }, [currency]);
  const currencyName = currency
    ? currency.type === "TokenCurrency"
      ? currency.parentCurrency.name
      : currency.name
    : undefined;
  return (
    <>
      <TrackPage category="AddAccounts" name="Step2" currencyName={currencyName} />
      <DeviceAction
        action={action}
        request={{
          currency: currency.type === "TokenCurrency" ? currency.parentCurrency : currency,
        }}
        onResult={() => {
          transitionTo("import");
        }}
        analyticsPropertyFlow={flow}
      />
    </>
  );
};
export default StepConnectDevice;
