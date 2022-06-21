import { useState, useEffect } from "react";
import { AvailableProviderV3 } from "../types";
import getProviders from "../getProviders";

export function useProviders(): AvailableProviderV3[] {
  const [res, setRes] = useState<AvailableProviderV3[]>([]);

  useEffect(() => {
    fetch();

    async function fetch() {
      const res = (await getProviders()) as AvailableProviderV3[];
      setRes(res);
    }
  }, []);

  return res;
}
