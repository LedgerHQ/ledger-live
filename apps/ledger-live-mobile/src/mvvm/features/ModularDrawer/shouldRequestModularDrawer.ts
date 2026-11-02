import type { ModularDrawerCompletionMode } from "./types";

type ShouldRequestModularDrawerParams = Readonly<{
  isOpen: boolean;
  hasSearchedValue: boolean;
  hasOneCurrency: boolean;
  enableAccountSelection: boolean;
  completionMode?: ModularDrawerCompletionMode;
  isAssetsError: boolean;
  isCurrentCatalogReady: boolean;
  hasPresentedSheet: boolean;
  canAutoResolveSingleAsset: boolean;
}>;

export function shouldRequestModularDrawer({
  isOpen,
  hasSearchedValue,
  hasOneCurrency,
  enableAccountSelection,
  completionMode,
  isAssetsError,
  isCurrentCatalogReady,
  hasPresentedSheet,
  canAutoResolveSingleAsset,
}: ShouldRequestModularDrawerParams): boolean {
  if (!isOpen) return false;
  if (hasSearchedValue) return true;
  if (hasOneCurrency && !enableAccountSelection) return false;

  const suppressesUnpresentedSingleAsset =
    completionMode === "currency" &&
    isCurrentCatalogReady &&
    canAutoResolveSingleAsset &&
    !hasPresentedSheet;

  if (suppressesUnpresentedSingleAsset) return false;

  const defersUnpresentedCurrencyCatalog =
    completionMode === "currency" &&
    !enableAccountSelection &&
    !isCurrentCatalogReady &&
    !isAssetsError &&
    !hasPresentedSheet;

  return !defersUnpresentedCurrencyCatalog;
}
