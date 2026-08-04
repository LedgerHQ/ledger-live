import { useEffect, useState } from "react";
import { changes, getEnv, type EnvName, type EnvValue } from "@shared/env";

export function useEnv<K extends EnvName>(name: K): EnvValue<K> {
  const [env, setEnv] = useState<EnvValue<K>>(() => getEnv(name));
  useEffect(() => {
    setEnv(getEnv(name));
    const sub = changes.subscribe(({ name: n, value }) => {
      if (n === name) setEnv(value as EnvValue<K>);
    });
    return () => sub.unsubscribe();
  }, [name]);
  return env;
}

export default useEnv;
