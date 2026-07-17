import { useEffect, useState } from "react";
import { changes, getEnv } from "@shared/live-env";
import type { EnvName, EnvValue } from "@shared/live-env";

export function useEnv<K extends EnvName>(name: K): EnvValue<K> {
  const [env, setEnvState] = useState<EnvValue<K>>(() => getEnv(name));
  useEffect(() => {
    setEnvState(getEnv(name));
    const sub = changes.subscribe(({ name: n, value }) => {
      if (n === name) setEnvState(value as EnvValue<K>);
    });
    return () => sub.unsubscribe();
  }, [name]);
  return env;
}

export default useEnv;
