import React, { useMemo } from "react";
import { StepProps } from "../..";
import { getEnv } from "@ledgerhq/live-common/env";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import DeviceAction from "~/renderer/components/DeviceAction";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectApp);

type Props = Partial<StepProps> & { onDone: () => void };
const Apps = ({ onDone }: Props) => {
  const dependencies = useMemo(() => ["1inch"], []);
  const commandRequest = useMemo(
    () => ({
      dependencies: dependencies.map(appName => ({ appName })),
      appName: "BOLOS",
      withInlineInstallProgress: true,
      allowPartialDependencies: true,
    }),
    [dependencies],
  );

  return <DeviceAction action={action} request={commandRequest} onResult={onDone} />;
};

export default Apps;
