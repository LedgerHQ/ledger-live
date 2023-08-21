import { useEffect, useState } from "react";
import { changes, getEnv } from "@ledgerhq/live-env";
import type { EnvName, EnvValue } from "@ledgerhq/live-env";
export default function useEnv<Name extends EnvName>(type: Name): EnvValue<Name> {
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
}
