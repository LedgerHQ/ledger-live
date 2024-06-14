import React, { useCallback } from "react";
import { Actionable } from "./Actionable";
import { useSDK } from "../context";
import { runWithDevice } from "../device";

export function AppDeviceAuthenticate({
  deviceJWT,
  setDeviceJWT,
}: {
  deviceJWT: { accessToken: string } | null;
  setDeviceJWT: (deviceJWT: { accessToken: string } | null) => void;
}) {
  const sdk = useSDK();

  const action = useCallback(
    () => runWithDevice(transport => sdk.authWithDevice(transport)),
    [sdk],
  );

  const valueDisplay = useCallback(
    (deviceJWT: { accessToken: string }) => deviceJWT.accessToken,
    [],
  );

  return (
    <Actionable
      buttonTitle="sdk.authWithDevice"
      inputs={[]}
      action={action}
      valueDisplay={valueDisplay}
      value={deviceJWT}
      setValue={setDeviceJWT}
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content":
          "authenticates with hardware wallet. Trustchain app must be open on the device.",
      }}
    />
  );
}
