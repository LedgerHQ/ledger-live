import React, { useCallback, useState } from "react";
import { setEnv, getEnvDefault } from "@ledgerhq/live-env";
import { Actionable } from "./Actionable";
import useEnv from "../useEnv";
import { Input } from "./Input";

export function AppSetTrustchainAPIEnv() {
  const env = useEnv("TRUSTCHAIN_API");
  const [localValue, setLocalValue] = useState(env);
  const action = useCallback(() => Promise.resolve(localValue), [localValue]);
  return (
    <Actionable
      buttonTitle="Set Trustchain API"
      inputs={[]}
      action={action}
      value={env}
      setValue={v => setEnv("TRUSTCHAIN_API", v || getEnvDefault("TRUSTCHAIN_API"))}
      valueDisplay={() => (
        <Input type="text" value={localValue} onChange={e => setLocalValue(e.target.value)} />
      )}
    />
  );
}
