export function parseUiUseCase(uiUseCase?: string) {
  const [namespace, variant] = uiUseCase?.split(":") ?? [];

  return {
    namespace,
    variant,
    isPerpsWithoutVariant: namespace === "perpetuals" && !variant,
    hasVariant: Boolean(variant),
  };
}
