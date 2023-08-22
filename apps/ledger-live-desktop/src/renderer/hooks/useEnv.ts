import { useEffect, useState } from "react";
import { changes, getEnv, EnvValue, EnvName } from "@ledgerhq/live-env";
const useEnv = (type: EnvName): EnvValue<EnvName> => {
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
export default useEnv;
