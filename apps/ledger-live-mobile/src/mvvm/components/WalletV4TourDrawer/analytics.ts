export const withOptionalVariant = <T extends object>(properties: T, variant?: string) =>
  variant === undefined ? properties : { ...properties, variant };
