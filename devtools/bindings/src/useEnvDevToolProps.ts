import { useCallback, useEffect, useState } from "react";
import {
  getAllEnvs,
  getEnvDesc,
  isEnvDefault,
  setEnvUnsafe,
  getDefinition,
  changes,
} from "@shared/env";
import type { EnvDevToolProps, EnvVarEntry } from "@devtools/env";

function buildSnapshot(): EnvVarEntry[] {
  const all: Record<string, unknown> = getAllEnvs();
  return Object.entries(all).map(([key, value]) => ({
    key,
    value: String(value),
    defaultValue: String(getDefinition(key)?.def ?? ""),
    desc: getEnvDesc(key) ?? "",
    isOverridden: !isEnvDefault(key),
  }));
}

export function useEnvDevToolProps(): EnvDevToolProps {
  const [envVars, setEnvVars] = useState<EnvVarEntry[]>(() => buildSnapshot());

  useEffect(() => {
    const sub = changes.subscribe(() => setEnvVars(buildSnapshot()));
    return () => sub.unsubscribe();
  }, []);

  const onOverride = useCallback((key: string, rawValue: string) => {
    setEnvUnsafe(key, rawValue);
  }, []);

  const onReset = useCallback((key: string) => {
    const definition = getDefinition(key);
    if (definition != null) setEnvUnsafe(key, definition.def);
  }, []);

  return { envVars, onOverride, onReset };
}
