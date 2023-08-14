import { PromiseResult } from "../types";

/**
 * Needed polyfill for Promise.allSettled as it doesn't exist on RN.
 */
export const allSettled = <T>(promises: Promise<T>[]): Promise<PromiseResult<T>[]> => {
  return Promise.all(
    promises.map(p => {
      return p
        .then(value => {
          return {
            status: "fulfilled" as const,
            value,
          };
        })
        .catch((reason: unknown) => {
          return {
            status: "rejected" as const,
            reason,
          };
        });
    }),
  );
};

/**
 * Helper to know in advance if a domain is compatible with the nano
 *
 * @param domain string representing the domain
 * @returns {Boolean}
 */
export const validateDomain = (domain: string | undefined): boolean => {
  if (typeof domain !== "string") {
    return false;
  }

  const lengthIsValid = domain.length > 0 && Number(domain.length) < 30;
  const containsOnlyValidChars = new RegExp("^[a-zA-Z0-9\\-\\_\\.]+$").test(domain);

  return lengthIsValid && containsOnlyValidChars;
};
