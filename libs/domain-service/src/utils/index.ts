export const validateDomain = (domain: string | undefined) =>
  Number(domain?.length) < 255;
