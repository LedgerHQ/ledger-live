import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import React, { useEffect } from "react";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import TrackPage from "~/renderer/analytics/TrackPage";
import { prepareCurrency } from "~/renderer/bridge/cache";
import DeviceAction from "~/renderer/components/DeviceAction";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

interface Props {
  analyticsPropertyFlow?: string;
  currency: CryptoCurrency;
  onConnect: (_: AppResult) => void;
}

export const ConnectYourDevice = ({
  currency,
  onConnect,
  analyticsPropertyFlow,
}: Readonly<Props>) => {
  // preload currency ahead of time
  useEffect(() => {
    prepareCurrency(currency);
  }, [currency]);

  const action = useConnectAppAction();

  return (
    <>
      <TrackPage
        category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY}
        name="ConnectYourDevice"
        currencyName={currency.name}
      />
      <DeviceAction
        action={action}
        request={{ currency }}
        onResult={onConnect}
        // onError={e => {
        //   console.log("ERROR", e);
        // }}
        // onSelectDeviceLink={() => {
        //   console.log("SELECT DEVICE LINK");
        // }}
        analyticsPropertyFlow={analyticsPropertyFlow}
        // TODO Location == Drawer
        location={HOOKS_TRACKING_LOCATIONS.addAccountModal}
      />
    </>
  );
};

export default ConnectYourDevice;
