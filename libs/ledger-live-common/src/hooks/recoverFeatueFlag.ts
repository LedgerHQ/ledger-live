import { useMemo } from "react";

export function useReplacedURI(uri?: string, id?: string): string | undefined {
  return useMemo(() => {
    return uri && id ? uri.replace("protect-simu", id) : undefined;
  }, [id, uri]);
}
