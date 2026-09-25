import type {
  StepDescription,
  StepArgs,
  StepDescriptionLike,
  StepDescriptionFriendly,
} from './types';

/**
 * Concatenates multiple StepDescription objects or strings into a single StepDescription.
 * This is useful for combining descriptions from different sources.
 * Metadata from the last non-null StepDescription is preserved.
 */
export function concat(...results: (StepDescriptionLike | null)[]): StepDescription {
  return {
    message: results.map(stringify).reduce(joinSpace, ''),
    args: results.map(getArgs).reduce(mergeArgs),
  };
}

export function glue(...results: (StepDescriptionLike | null)[]): StepDescription {
  return {
    message: results.map(stringify).reduce(join, ''),
    args: results.map(getArgs).reduce(mergeArgs),
  };
}

/**
 * Creates a StepDescription with the given message, args, and metadata.
 */
export function msg(message?: string, args?: StepArgs): StepDescription {
  return {
    message,
    args: omitEmpty(args),
  };
}

/**
 * Converts a StepDescription or string to a string.
 */
function stringify(desc: StepDescriptionLike | null | undefined): string | null {
  if (!desc) return null;
  if (typeof desc === 'string') return desc;
  if (supportsStepDescriptions(desc)) return desc.toJSON().message || null;
  return desc.message || null;
}

function supportsStepDescriptions(obj: object): obj is StepDescriptionFriendly {
  return Boolean('toJSON' in obj);
}

/**
 * Joins two strings with a space, handling null values.
 */
function joinSpace(acc: string, desc: string | null): string {
  return acc && desc ? `${acc} ${desc}` : desc || acc;
}

/**
 * Joins two strings without a space, handling null values.
 */
function join(acc: string, desc: string | null): string {
  return acc && desc ? `${acc}${desc}` : desc || acc;
}

/**
 * Removes null or undefined values from an object.
 */
function omitEmpty(args: StepArgs): StepArgs {
  return args ? Object.fromEntries(Object.entries(args).filter(isNotNullish)) : args;
}

/**
 * Returns true if the value is not null or undefined.
 */
function isNotNullish([_key, value]: [string, unknown]): boolean {
  return value != null;
}

/**
 * Gets the args from a StepDescription or returns null.
 */
function getArgs(r: StepDescriptionLike | null): StepArgs {
  if (!r) return null;
  if (typeof r === 'string') return null;
  if (supportsStepDescriptions(r)) return r.toJSON().args;
  return r.args;
}

/**
 * Merges two StepArgs objects.
 */
function mergeArgs(acc: StepArgs, r: StepArgs): StepArgs {
  return r == null ? acc : { ...acc, ...r };
}

export function percent(value?: unknown): string {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(num) ? (num * 100).toFixed(0) + '%' : '';
}

// Separate function for toBeVisible call as it's parameter is directly in %
export function percentVisible(value?: unknown): string {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(num) ? num.toFixed(0) + '%' : '';
}

export function truncate(value?: unknown, maxLength = 40): string {
  if (!value) return '';

  const str = typeof value === 'string' ? value : String(value);
  if (str.length <= maxLength) return str;

  const charsToShow = maxLength - 1; // -1 for the ellipsis
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  const backStart = str.length - backChars;

  return str.slice(0, Math.max(0, frontChars)) + '…' + str.slice(Math.max(0, backStart));
}
