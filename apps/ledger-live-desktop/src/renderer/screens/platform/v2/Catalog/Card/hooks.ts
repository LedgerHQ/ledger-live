import { useMemo, useCallback } from "react";
import { PropsRaw } from "./types";

export function useCard({ manifest, onClick: onClickProp }: PropsRaw) {
  const hostname = useMemo(
    // @ts-expect-error not all params type has dappUrl field
    () => new URL(manifest.params?.dappUrl ?? manifest.url).hostname.replace("www.", ""),
    // @ts-expect-error not all params type has dappUrl field
    [manifest.params?.dappUrl, manifest.url],
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
