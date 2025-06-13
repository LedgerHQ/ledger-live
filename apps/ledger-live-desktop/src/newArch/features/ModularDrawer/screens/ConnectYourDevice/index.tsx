import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import React, { useEffect, useMemo } from "react";
import { prepareCurrency } from "~/renderer/bridge/cache";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import invariant from "invariant";
import TrackPage from "~/renderer/analytics/TrackPage";
import DeviceAction from "~/renderer/components/DeviceAction";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

interface Props {
  onConnect: () => void;
  currency: CryptoOrTokenCurrency;
  analyticsPropertyFlow?: string;
}

export const ConnectYourDevice = ({
  currency,
  onConnect,
  analyticsPropertyFlow,
}: Readonly<Props>) => {
  invariant(currency, "No crypto asset given");

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
        onResult={onConnect}
        analyticsPropertyFlow={analyticsPropertyFlow}
        // TODO Location == Drawer
        location={HOOKS_TRACKING_LOCATIONS.addAccountModal}
      />
    </>
  );
};

export default ConnectYourDevice;
