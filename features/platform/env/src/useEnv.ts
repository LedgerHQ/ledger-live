import { useEffect, useState } from "react";
import { changes, getEnv, type EnvName, type EnvValue } from "@shared/env";

/**
 * @deprecated `@shared/env` is being sunset with `@ledgerhq/live-env`. A value a component has to
 * re-render on belongs in a feature flag or in the app's own state — see
 * https://github.com/LedgerHQ/ledger-live/blob/develop/shared/env/MIGRATION.md
 */
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
