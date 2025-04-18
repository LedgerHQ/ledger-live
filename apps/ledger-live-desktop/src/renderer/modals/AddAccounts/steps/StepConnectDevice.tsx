import invariant from "invariant";
import React, { useEffect, useMemo } from "react";
import { prepareCurrency } from "~/renderer/bridge/cache";
import TrackPage from "~/renderer/analytics/TrackPage";
import DeviceAction from "~/renderer/components/DeviceAction";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import { StepProps } from "..";
import { getEnv } from "@ledgerhq/live-env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const StepConnectDevice = ({ currency, transitionTo, flow }: StepProps) => {
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  invariant(currency, "No crypto asset given");

  // preload currency ahead of time
  useEffect(() => {
    if (currency && currency.type === "CryptoCurrency") {
      prepareCurrency(currency);
    }
  }, [currency]);
  const action = createAction(
    getEnv("MOCK") ? mockedEventEmitter : connectApp({ isLdmkConnectAppEnabled }),
  );

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
