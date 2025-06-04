import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import invariant from "invariant";
import React, { useEffect, useMemo } from "react";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import TrackPage from "~/renderer/analytics/TrackPage";
import { prepareCurrency } from "~/renderer/bridge/cache";
import DeviceAction from "~/renderer/components/DeviceAction";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";

interface Props {
  analyticsPropertyFlow?: string;
  currency: CryptoOrTokenCurrency;
  onConnect: (_: AppResult) => void;
}

export const ConnectYourDevice = ({
  currency,
  onConnect,
  analyticsPropertyFlow,
}: Readonly<Props>) => {
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

  const request = useMemo(
    () => ({
      currency: currency.type === "TokenCurrency" ? currency.parentCurrency : currency,
    }),
    [currency],
  );

  const action = useConnectAppAction();

  return (
    <>
      <TrackPage
        category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY}
        name="ConnectYourDevice"
        currencyName={currencyName}
      />
      <DeviceAction
        action={action}
        request={request}
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
