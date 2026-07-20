import { useEffect, useState } from "react";
import { changes, getEnv, type EnvName, type EnvValue } from "@shared/live-env";

export default function useEnv<Name extends EnvName>(type: Name): EnvValue<Name> {
  const [env, setEnv] = useState(() => getEnv(type));
  useEffect(() => {
    const sub = changes.subscribe(({ name }) => {
      if (type === name) {
        setEnv(getEnv(type));
      }
    });
    return () => sub.unsubscribe();
  }, [type]);
  return env;
}
