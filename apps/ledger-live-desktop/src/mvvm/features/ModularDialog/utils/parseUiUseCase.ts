export function parseUiUseCase(uiUseCase?: string) {
  const [namespace, variant] = uiUseCase?.split(":") ?? [];
  const isPerps = namespace === "perpetuals";

  return {
    namespace,
    variant,
    isPerpsWithoutVariant: isPerps && !variant,
    isPerpsDeposit: isPerps && variant === "deposit",
  };
}
