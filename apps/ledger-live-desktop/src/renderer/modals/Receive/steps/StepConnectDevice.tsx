import React, { useMemo } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import DeviceAction from "~/renderer/components/DeviceAction";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import TrackPage from "~/renderer/analytics/TrackPage";
import { StepProps } from "../Body";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";

export default function StepConnectDevice({
  account,
  parentAccount,
  token,
  transitionTo,
}: StepProps) {
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const tokenCurrency = (account && account.type === "TokenAccount" && account.token) || token;
  const action = useConnectAppAction();

  const request = useMemo(
    () => ({
      account: mainAccount || undefined,
      tokenCurrency: tokenCurrency || undefined,
    }),
    [mainAccount, tokenCurrency],
  );
  return (
    <>
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      <DeviceAction
        action={action}
        request={request}
        onResult={() => transitionTo("receive")}
        analyticsPropertyFlow="receive"
        location={HOOKS_TRACKING_LOCATIONS.receiveModal}
      />
    </>
  );
}
export function StepConnectDeviceFooter({ t, onSkipConfirm, eventType, currencyName }: StepProps) {
  return (
    <Box horizontal flow={2}>
      <TrackPage
        category={`Receive Flow${eventType ? ` (${eventType})` : ""}`}
        name="Step 2"
        currencyName={currencyName}
      />
      <Button
        event="Receive Flow Without Device Clicked"
        data-testid="receive-connect-device-skip-device-button"
        onClick={onSkipConfirm}
      >
        {t("receive.steps.connectDevice.withoutDevice")}
      </Button>
    </Box>
  );
}
