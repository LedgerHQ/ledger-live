import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import DeviceAction from "~/renderer/components/DeviceAction";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import TrackPage from "~/renderer/analytics/TrackPage";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { StepProps } from "../Body";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { getEnv } from "@ledgerhq/live-common/env";
const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);
export default function StepConnectDevice({
  account,
  parentAccount,
  token,
  transitionTo,
}: StepProps) {
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const tokenCurrency = (account && account.type === "TokenAccount" && account.token) || token;
  return (
    <>
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      <DeviceAction
        action={action}
        request={{
          account: mainAccount,
          tokenCurrency,
        }}
        onResult={() => transitionTo("receive")}
        analyticsPropertyFlow="receive"
      />
    </>
  );
}
export function StepConnectDeviceFooter({
  t,
  transitionTo,
  onSkipConfirm,
  device,
  eventType,
  currencyName,
}: StepProps) {
  return (
    <Box horizontal flow={2}>
      <TrackPage
        category={`Receive Flow${eventType ? ` (${eventType})` : ""}`}
        name="Step 2"
        currencyName={currencyName}
      />
      <Button
        event="Receive Flow Without Device Clicked"
        data-test-id="receive-connect-device-skip-device-button"
        onClick={onSkipConfirm}
      >
        {t("receive.steps.connectDevice.withoutDevice")}
      </Button>
    </Box>
  );
}
