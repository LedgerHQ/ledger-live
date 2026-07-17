import { useEffect, useState } from "react";
import { changes, getEnv } from "@ledgerhq/live-env";

export default function useEnv<T = unknown>(type: string): T {
  const [env, setEnv] = useState<T>(() => getEnv<T>(type));
  useEffect(() => {
    const sub = changes.subscribe(({ name, value }) => {
      if (type === name) {
        setEnv(value as T);
      }
    });
    return () => sub.unsubscribe();
  }, [type]);
  return env;
}
