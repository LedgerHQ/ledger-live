import { useState, useEffect } from "react";
import { AvailableProviderV3 } from "../types";
import getProviders from "../getProviders";

export function useProviders(disabled = ""): {
  providers: AvailableProviderV3[];
  error?: Error;
} {
  const [providers, setProviders] = useState<AvailableProviderV3[]>([]);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    fetch();

    async function fetch() {
      try {
        const res = (await getProviders()) as AvailableProviderV3[];
        const filtered = res.filter((p) => !disabled.includes(p.provider));

        setProviders(filtered);
      } catch (e) {
        setError(e as Error);
      }
    }
  }, [disabled]);

  return {
    providers,
    error,
  };
}
