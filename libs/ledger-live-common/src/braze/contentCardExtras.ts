/**
 * Braze extras are always Record<string, string>. These helpers convert the
 * `order` field to a number so that sorting and analytics tracking receive a
 * consistent numeric value instead of a raw string, "NaN", or undefined.
 */

export const parseOrder = (value: string | undefined): number | undefined => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const sanitizeExtras = (
  extras: Record<string, string> | undefined,
): Record<string, string | number> => {
  if (!extras) return {};
  const { order, displayedPosition: _displayedPosition, ...rest } = extras;
  const parsed = parseOrder(order);
  return parsed !== undefined ? { ...rest, order: parsed } : { ...rest };
};

export type ContentCardEventProperties = Record<string, string | number | undefined>;

export const ContentCardEvent = {
  Impression: "contentcard_impression",
  Clicked: "contentcard_clicked",
  Dismissed: "contentcard_dismissed",
} as const;

export type ContentCardEvent = (typeof ContentCardEvent)[keyof typeof ContentCardEvent];

export type ContentCardInteractionEvent =
  | typeof ContentCardEvent.Clicked
  | typeof ContentCardEvent.Dismissed;

/** Strip leaked Braze displayedPosition and keep only a numeric app index when provided. */
export const finalizeContentCardEventProperties = (
  props: ContentCardEventProperties,
): Record<string, string | number> => {
  const { displayedPosition, ...base } = props;
  return typeof displayedPosition === "number" && Number.isFinite(displayedPosition)
    ? { ...base, displayedPosition }
    : (base as Record<string, string | number>);
};

const TOP_WALLET_ALWAYS_ON_CATEGORY_ID = "alwayson";

const resolveCategoryLocation = (
  categoryExtras: Record<string, string> | undefined,
): string | undefined => {
  if (!categoryExtras) return undefined;
  if (categoryExtras.id === TOP_WALLET_ALWAYS_ON_CATEGORY_ID) return "top_wallet";
  return categoryExtras.location;
};

export const isCategoryContentCardExtras = (extras: Record<string, string> | undefined): boolean =>
  extras?.type === "category";

export type ContentCardTrackingContext = {
  cardExtras?: Record<string, string>;
  categoryExtras?: Record<string, string>;
  categoryLocation?: string;
};

export const buildContentCardTrackingProperties = ({
  cardExtras,
  categoryExtras,
  categoryLocation,
}: ContentCardTrackingContext): Record<string, string | number> => {
  const {
    canvas_name: _cn,
    canvas_step_name: _csn,
    location: _loc,
    ...rest
  } = sanitizeExtras(cardExtras);
  const page = categoryLocation ?? resolveCategoryLocation(categoryExtras) ?? cardExtras?.location;
  const canvas_name = cardExtras?.canvas_name ?? categoryExtras?.canvas_name;
  const canvas_step_name = cardExtras?.canvas_step_name;

  return {
    ...rest,
    ...(page && { page, location: page }),
    ...(canvas_name && { canvas_name }),
    ...(canvas_step_name && { canvas_step_name }),
  };
};
