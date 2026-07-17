import { useEffect, useState } from "react";
import { changes } from "@ledgerhq/live-env";
import { getEnv } from ".";
import type { EnvName } from ".";
import { allDefinitions } from "./definitions";

type InferEnv<K extends EnvName> = NonNullable<ReturnType<(typeof allDefinitions)[K]["parser"]>>;

export default function useEnv<K extends EnvName>(name: K): InferEnv<K> {
  const [env, setEnvState] = useState<InferEnv<K>>(() => getEnv(name));
  useEffect(() => {
    const sub = changes.subscribe(({ name: n, value }) => {
      if (n === name) {
        setEnvState(value as InferEnv<K>);
      }
    });
    return () => sub.unsubscribe();
  }, [name]);
  return env;
}
