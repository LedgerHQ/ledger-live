import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import React, { useEffect } from "react";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import TrackPage from "~/renderer/analytics/TrackPage";
import { prepareCurrency } from "~/renderer/bridge/cache";
import DeviceAction from "~/renderer/components/DeviceAction";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useOnDemandCurrencyCountervalues } from "~/renderer/actions/deprecated/ondemand-countervalues";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";

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
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  useOnDemandCurrencyCountervalues(currency, counterValueCurrency);

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
        analyticsPropertyFlow={analyticsPropertyFlow}
        location={HOOKS_TRACKING_LOCATIONS.addAccountModal}
      />
    </>
  );
};

export default React.memo(ConnectYourDevice);
