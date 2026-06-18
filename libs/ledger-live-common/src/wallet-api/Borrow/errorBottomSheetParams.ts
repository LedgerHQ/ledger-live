/**
 * Shared validation for the `custom.bottomSheet.error` wallet-api method exposed
 * by the Borrow live app. The handler always renders an error-toned bottom sheet
 * (driven by `BottomSheetErrorGradient` on mobile), so the visual tone is fixed
 * and the params only describe the textual content.
 */

export interface BorrowErrorBottomSheetParams {
  title: string;
  description: string;
  ctaLabel: string;
}

export function sanitizeBorrowErrorBottomSheetParams(
  params: BorrowErrorBottomSheetParams | undefined,
  handlerName: string,
): BorrowErrorBottomSheetParams {
  if (!params || typeof params !== "object") {
    throw new Error(`Invalid params for ${handlerName}: params are required.`);
  }

  const { title, description, ctaLabel } = params;

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof ctaLabel !== "string"
  ) {
    throw new TypeError(
      `Invalid params for ${handlerName}: 'title', 'description' and 'ctaLabel' must be strings.`,
    );
  }

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const trimmedCtaLabel = ctaLabel.trim();

  if (!trimmedTitle || !trimmedDescription || !trimmedCtaLabel) {
    throw new Error(
      `Invalid params for ${handlerName}: 'title', 'description' and 'ctaLabel' must be non-empty.`,
    );
  }

  return {
    title: trimmedTitle,
    description: trimmedDescription,
    ctaLabel: trimmedCtaLabel,
  };
}
