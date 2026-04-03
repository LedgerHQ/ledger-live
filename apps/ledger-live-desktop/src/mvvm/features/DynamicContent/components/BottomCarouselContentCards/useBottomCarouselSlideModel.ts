import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";

import { openURL } from "~/renderer/linking";
import type { PortfolioContentCard } from "~/types/dynamicContent";
import type { CarouselActions } from "../../types";

export type BottomCarouselMediaHeader =
  | { kind: "picto"; ledgerId: string }
  | { kind: "tag"; label: string }
  | null;

type Args = Pick<PortfolioContentCard, "id" | "path" | "url" | "tag" | "picto"> &
  Pick<CarouselActions, "logSlideClick" | "dismissCard"> & {
    index: number;
  };

export function useBottomCarouselSlideModel({
  id,
  path,
  url,
  tag,
  picto,
  index,
  logSlideClick,
  dismissCard,
}: Args) {
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    dismissCard(index);
  }, [dismissCard, index]);

  const handleClick = useCallback(() => {
    logSlideClick(id);
    if (path) {
      navigate(path, { state: { source: "banner" } });
    } else if (url) {
      openURL(url);
    }
  }, [id, logSlideClick, navigate, path, url]);

  const hasClickTarget = Boolean(path || url);

  const mediaHeader = useMemo((): BottomCarouselMediaHeader => {
    if (picto != null && picto !== "") {
      return { kind: "picto", ledgerId: picto };
    }
    if (tag) {
      return { kind: "tag", label: tag };
    }
    return null;
  }, [picto, tag]);

  return {
    handleClick,
    handleClose,
    hasClickTarget,
    mediaHeader,
  };
}
