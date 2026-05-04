const ALLOWED_ICONS = ["info", "warning", "success"] as const;

export type ActionDialogIcon = (typeof ALLOWED_ICONS)[number];

export interface ActionDialogParams {
  title: string;
  description: string;
  ctaLabel: string;
  icon?: ActionDialogIcon;
}

export function sanitizeActionDialogParams(
  params: ActionDialogParams | undefined,
  handlerName: string,
): ActionDialogParams {
  if (!params || typeof params !== "object") {
    throw new Error(`Invalid params for ${handlerName}: params are required.`);
  }

  const { title, description, ctaLabel, icon } = params;
  /*
   * Adding a check here since the parameters can be received from live apps
   * and be wrong (no validation on reception). Function signature is not enough
   */
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

  if (icon != null && !ALLOWED_ICONS.includes(icon)) {
    throw new Error(
      `Invalid params for ${handlerName}: 'icon' must be one of ${ALLOWED_ICONS.join(", ")} when provided.`,
    );
  }

  return {
    title: trimmedTitle,
    description: trimmedDescription,
    ctaLabel: trimmedCtaLabel,
    icon: icon ?? undefined,
  };
}
