import { useCallback, useMemo, type MouseEvent } from "react";

import * as Icons from "@ledgerhq/lumen-ui-react/symbols";

import type { ContentBannerActionCardProps } from "./types";
import { CONTENT_BANNER_ACTION_CARD_CLOSE_LABEL } from "./types";

export function useContentBannerActionCardViewModel({
  onClose,
  onClick,
  icon: iconName,
  image_background,
}: ContentBannerActionCardProps) {
  const handleClose = useCallback(
    (e?: MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      onClose();
    },
    [onClose],
  );

  // MediaBanner puts `onClick` on the root `div` while the dismiss control is an inner `button`.
  // Ignore clicks that originate from any `button` (e.g. close) so the main CTA does not run on dismiss.
  const handleMediaBannerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const t = e.target;
      if (t instanceof Element && t.closest("button")) return;
      onClick();
    },
    [onClick],
  );

  const icon = useMemo(
    () => (iconName && iconName in Icons ? Icons[iconName as keyof typeof Icons] : Icons.Settings),
    [iconName],
  );

  const hasImageBackground = Boolean(image_background && image_background.length > 0);

  return {
    closeAriaLabel: CONTENT_BANNER_ACTION_CARD_CLOSE_LABEL,
    handleClose,
    handleMediaBannerClick,
    hasImageBackground,
    icon,
    imageUrl: image_background ?? "",
  };
}
