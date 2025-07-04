import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import React, { useEffect } from "react";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { prepareCurrency } from "~/renderer/bridge/cache";
import DeviceAction from "~/renderer/components/DeviceAction";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useOnDemandCurrencyCountervalues } from "~/renderer/actions/deprecated/ondemand-countervalues";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { TrackAddAccountScreen } from "../../analytics/TrackAddAccountScreen";
import { ADD_ACCOUNT_FLOW_NAME, ADD_ACCOUNT_PAGE_NAME } from "../../analytics/addAccount.types";

interface Props {
  analyticsPropertyFlow?: string;
  currency: CryptoCurrency;
  source: string;
  onConnect: (_: AppResult) => void;
}

export const ConnectYourDevice = ({
  currency,
  onConnect,
  source,
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
      <TrackAddAccountScreen
        page={ADD_ACCOUNT_PAGE_NAME.DEVICE_CONNEXION}
        source={source}
        flow={ADD_ACCOUNT_FLOW_NAME}
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
