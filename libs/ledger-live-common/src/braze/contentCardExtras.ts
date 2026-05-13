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
  const { order, ...rest } = extras;
  const parsed = parseOrder(order);
  return parsed !== undefined ? { ...rest, order: parsed } : { ...rest };
};
