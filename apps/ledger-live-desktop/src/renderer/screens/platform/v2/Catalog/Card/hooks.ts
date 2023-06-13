import { useMemo, useCallback } from "react";
import { PropsRaw } from "./types";

export function useCard({ manifest, onClick: onClickProp }: PropsRaw) {
  const hostname = useMemo(
    () => new URL(manifest.url).hostname.replace("www.", ""),
    [manifest.url],
  );

  const onClick = useCallback(() => {
    onClickProp(manifest);
  }, [onClickProp, manifest]);

  return {
    hostname,
    disabled: manifest.branch === "soon",
    onClick,
    usedAt: manifest.usedAt,
  };
}
