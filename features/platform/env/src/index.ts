import { useEffect, useState } from "react";
import { changes, getEnv } from "@shared/live-env";
import type { EnvName, EnvValue } from "@shared/live-env";

export default function useEnv<K extends EnvName>(name: K): EnvValue<K> {
  const [env, setEnvState] = useState<EnvValue<K>>(() => getEnv(name));
  useEffect(() => {
    const sub = changes.subscribe(({ name: n, value }) => {
      if (n === name) setEnvState(value as EnvValue<K>);
    });
    return () => sub.unsubscribe();
  }, [name]);
  return env;
}
