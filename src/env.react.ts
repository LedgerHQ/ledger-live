import { useEffect, useState } from "react";
import { changes, getEnv } from "./env";
import type { EnvName, EnvValue } from "./env";

export const useEnv = <Name extends EnvName>(type: Name): EnvValue<Name> => {
  const [env, setEnv] = useState(() => getEnv(type));
  useEffect(() => {
    const sub = changes.subscribe(({ name, value }) => {
      if (type === name) {
        setEnv(value);
      }
    });
    return () => sub.unsubscribe();
  }, [type]);
  return env;
};
