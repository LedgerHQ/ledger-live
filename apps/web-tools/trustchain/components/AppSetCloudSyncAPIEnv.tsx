import React, { useCallback, useState } from "react";
import { setEnv, getEnvDefault } from "@ledgerhq/live-env";
import { Actionable } from "./Actionable";
import useEnv from "../useEnv";
import { Input } from "./Input";

export function AppSetCloudSyncAPIEnv() {
  const env = useEnv("CLOUD_SYNC_API_STAGING");
  const [localValue, setLocalValue] = useState(env);
  const action = useCallback(() => Promise.resolve(localValue), [localValue]);
  return (
    <Actionable
      buttonTitle="Set Cloud Sync API"
      inputs={[]}
      action={action}
      value={env}
      setValue={v => setEnv("CLOUD_SYNC_API_STAGING", v || getEnvDefault("CLOUD_SYNC_API_STAGING"))}
      valueDisplay={() => (
        <Input type="text" value={localValue} onChange={e => setLocalValue(e.target.value)} />
      )}
    />
  );
}
