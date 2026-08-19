import type { Card as BrazeCard } from "@braze/web-sdk";
import { appendDeeplinkLocationIfDefined } from "@ledgerhq/live-common/deeplinks/index";
import { parseOrder } from "@ledgerhq/live-common/braze/contentCardExtras";
import { ContentCardsType, LocationContentCard } from "~/types/dynamicContent";

type SmallSquareContentCardExtras = Readonly<{
  type: typeof ContentCardsType.smallSquare;
  categoryId?: string;
  title?: string;
  subDescription?: string;
  tag?: string;
  media?: string;
  mediaType?: string;
  filledMedia?: string;
  link?: string;
  order?: string;
  location?: string;
  platform?: string;
}>;

function isSmallSquareContentCardExtras(
  extras: Record<string, string>,
): extras is SmallSquareContentCardExtras & Record<string, string> {
  return extras.type === ContentCardsType.smallSquare;
}

export type SmallSquareContentCard = {
  id: string;
  title?: string;
  subDescription?: string;
  tag?: string;
  media?: string;
  mediaType?: "video" | "image" | "gif";
  filledMedia?: boolean;
  link?: string;
  location?: LocationContentCard;
  order?: number;
  created: Date | null;
  extras: SmallSquareContentCardExtras & Record<string, string>;
};

export const mapSmallSquareContentCard = (
  card: BrazeCard,
  categoryLocation?: LocationContentCard,
): SmallSquareContentCard | null => {
  const rawExtras = card.extras ?? {};
  if (!isSmallSquareContentCardExtras(rawExtras)) return null;

  const extras = rawExtras;
  const location = (extras.location as LocationContentCard | undefined) ?? categoryLocation;
  const mediaType = extras.mediaType;

  return {
    id: String(card.id),
    title: extras.title,
    subDescription: extras.subDescription,
    tag: extras.tag,
    media: extras.media,
    mediaType:
      mediaType === "video" || mediaType === "image" || mediaType === "gif" ? mediaType : undefined,
    filledMedia: extras.filledMedia === "true" || extras.filledMedia === "1",
    link: appendDeeplinkLocationIfDefined(extras.link, location),
    location,
    order: parseOrder(extras.order),
    created: "created" in card && card.created instanceof Date ? card.created : null,
    extras,
  };
};
