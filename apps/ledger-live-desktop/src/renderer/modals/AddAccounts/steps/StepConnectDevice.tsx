import invariant from "invariant";
import React, { useEffect, useMemo } from "react";
import { prepareCurrency } from "~/renderer/bridge/cache";
import TrackPage from "~/renderer/analytics/TrackPage";
import DeviceAction from "~/renderer/components/DeviceAction";
import { StepProps } from "..";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";

const StepConnectDevice = ({ currency, transitionTo, flow }: StepProps) => {
  invariant(currency, "No crypto asset given");

  // preload currency ahead of time
  useEffect(() => {
    if (currency && currency.type === "CryptoCurrency") {
      prepareCurrency(currency);
    }
  }, [currency]);
  const action = useConnectAppAction();

  const currencyName = currency
    ? currency.type === "TokenCurrency"
      ? currency.parentCurrency.name
      : currency.name
    : undefined;

  const request = useMemo(
    () => ({
      currency: currency.type === "TokenCurrency" ? currency.parentCurrency : currency,
    }),
    [currency],
  );
  return (
    <>
      <TrackPage category="AddAccounts" name="Step2" currencyName={currencyName} />
      <DeviceAction
        action={action}
        request={request}
        onResult={() => {
          transitionTo("import");
        }}
        analyticsPropertyFlow={flow}
        location={HOOKS_TRACKING_LOCATIONS.addAccountModal}
      />
    </>
  );
};
export default StepConnectDevice;
