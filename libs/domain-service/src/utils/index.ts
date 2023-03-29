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

  const lengthIsValid = domain.length > 0 && Number(domain.length) < 255;
  // disabling eslint as we do want to test control characters
  // eslint-disable-next-line no-control-regex
  const containsOnlyValidChars = new RegExp("^[\x00-\x7F]+$").test(domain);

  return lengthIsValid && containsOnlyValidChars;
};
