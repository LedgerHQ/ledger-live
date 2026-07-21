import ICUBase from "i18next-icu";
import { IntlMessageFormat } from "intl-messageformat";

/**
 * Shared ICU MessageFormat setup for i18next (LIVE-31440). Used by the app init
 * and by tests so both behave identically.
 */

/**
 * i18next used to stringify every non-primitive interpolation value.
 * `IntlMessageFormat` does not: when a referenced value is a non-primitive
 * (a `BigNumber`, an array of addresses, a plain object…), `format()` returns
 * an ARRAY of parts instead of a string, which breaks callers that expect a
 * string (e.g. `TranslatedError`). We coerce such values to strings first,
 * matching i18next's previous behaviour, while leaving values ICU needs typed
 * untouched: numbers (plural/number), Dates (date/time) and React elements /
 * functions (rich-text via `<Trans>`).
 */
function coerceValue(v: unknown): unknown {
  const t = typeof v;
  // Leave untouched the values ICU needs typed (numbers, Dates) and the ones
  // <Trans> renders as rich text (React elements, tag-handler functions).
  const keepAsIs =
    v === null ||
    v === undefined ||
    t === "string" ||
    t === "number" ||
    t === "boolean" ||
    t === "function" ||
    (t === "object" && (v instanceof Date || (v as { $$typeof?: symbol }).$$typeof !== undefined));
  if (keepAsIs) return v;
  // bigint, BigNumber, arrays, plain objects → stringify like i18next used to.
  return (v as { toString(): string }).toString();
}

function coerceObjectValues(options: unknown): unknown {
  if (!options || typeof options !== "object") return options;
  const src = options as Record<string, unknown>;
  let changed = false;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(src)) {
    const coerced = coerceValue(src[k]);
    if (coerced !== src[k]) changed = true;
    out[k] = coerced;
  }
  return changed ? out : options;
}

class ICUImpl extends (ICUBase as unknown as new (config?: unknown) => {
  parse(...args: unknown[]): unknown;
}) {
  parse(res: unknown, options: unknown, ...rest: unknown[]) {
    return super.parse(res, coerceObjectValues(options), ...rest);
  }
}

// Re-type as the original i18next-icu module so `.use(ICU)` typechecks exactly
// like the untouched plugin (the parse override is an internal implementation
// detail).
const ICU = ICUImpl as unknown as typeof ICUBase;

/**
 * Plural/select keys are ICU. If one is resolved without `count` (legacy
 * call-sites), IntlMessageFormat throws; we fall back to the singular form so a
 * raw ICU template is never shown (mirrors i18next's old behaviour where the
 * un-suffixed base key was the singular form).
 */
export const icuI18nFormat = {
  parseErrorHandler: (_err: Error, _key: string, res: string, options: unknown): string => {
    try {
      return new IntlMessageFormat(res, (options as { lng?: string }).lng).format({
        count: 1,
        ...(coerceObjectValues(options) as Record<string, unknown>),
      }) as string;
    } catch {
      return res;
    }
  },
};

export { ICU };
