import React, { useCallback, useEffect, useState } from "react";
import { setEnv, getEnvDefault } from "@ledgerhq/live-env";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import { Actionable } from "./Actionable";
import { ApiUrlPresets } from "./ApiUrlPresets";
import useEnv from "../useEnv";

export function AppSetTrustchainAPIEnv() {
  const env = useEnv("TRUSTCHAIN_API_STAGING");
  const [localValue, setLocalValue] = useState(env);

  useEffect(() => {
    setLocalValue(env);
  }, [env]);

  const applyStaging = useCallback(() => {
    const url = getEnvDefault("TRUSTCHAIN_API_STAGING");
    setLocalValue(url);
    setEnv("TRUSTCHAIN_API_STAGING", url);
  }, []);

  const applyProd = useCallback(() => {
    const url = getEnvDefault("TRUSTCHAIN_API_PROD");
    setLocalValue(url);
    setEnv("TRUSTCHAIN_API_STAGING", url);
  }, []);

  const action = useCallback(() => Promise.resolve(localValue), [localValue]);
  return (
    <Actionable
      buttonTitle="Set Trustchain API"
      inputs={[]}
      action={action}
      value={env}
      setValue={v => setEnv("TRUSTCHAIN_API_STAGING", v || getEnvDefault("TRUSTCHAIN_API_STAGING"))}
      valueDisplay={() => (
        <div className="flex min-w-0 flex-1 items-center gap-8">
          <ApiUrlPresets onStaging={applyStaging} onProd={applyProd} />
          <TextInput
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            className="min-w-0 flex-1"
          />
        </div>
      )}
    />
  );
}
