// @flow

import invariant from "invariant";
import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { StepProps } from "~/renderer/modals/MigrateAccounts";
import DeviceAction from "~/renderer/components/DeviceAction";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import { getEnv } from "@ledgerhq/live-common/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);

const StepConnectDevice = ({ t, currency, device, transitionTo }: StepProps) => {
  invariant(currency, "missing account/currency data");
  return (
    <>
      <TrackPage category="MigrateAccounts" name="Step2" />
      <DeviceAction
        action={action}
        request={{ currency }}
        onResult={() => {
          transitionTo("currency");
        }}
      />
    </>
  );
};

export default StepConnectDevice;
