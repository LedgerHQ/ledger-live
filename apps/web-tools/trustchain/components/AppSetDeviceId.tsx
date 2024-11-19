import React, { useCallback, useEffect, useState } from "react";
import { Actionable } from "./Actionable";

export function AppSetDeviceId({
  deviceId,
  setDeviceId,
}: {
  deviceId: string;
  setDeviceId: (deviceId: string) => void;
}) {
  const [localDeviceId, setLocalDeviceId] = useState(deviceId);
  useEffect(() => {
    setLocalDeviceId(deviceId);
  }, [deviceId]);

  const action = useCallback(
    (deviceId: string) => (setDeviceId(deviceId), deviceId),
    [setDeviceId],
  );

  return (
    <Actionable
      buttonTitle="Set DeviceId"
      inputs={deviceId !== localDeviceId ? [localDeviceId] : null}
      action={action}
      value={deviceId}
      setValue={v => setDeviceId(v || deviceId)}
      valueDisplay={v => v}
    >
      <select
        style={{
          width: "50%",
          padding: 6,
          fontSize: 16,
        }}
        value={localDeviceId}
        onChange={e => setLocalDeviceId(e.target.value)}
      >
        <option value="webhid">webhid</option>
        <option value="webble">webble</option>
        <option value="proxy">proxy</option>
      </select>
    </Actionable>
  );
}
