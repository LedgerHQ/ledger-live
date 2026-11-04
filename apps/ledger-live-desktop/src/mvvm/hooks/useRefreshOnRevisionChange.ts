import { useEffect, useRef } from "react";

export function useRefreshOnRevisionChange(refresh: () => unknown, revision: string) {
  const seen = useRef<string | null>(null);

  useEffect(() => {
    const previous = seen.current;
    seen.current = revision;
    if (previous !== null && previous !== revision) void refresh();
  }, [refresh, revision]);
}
