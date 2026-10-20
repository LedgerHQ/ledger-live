const ALLOWED_ICONS = ["deposit", "withdraw"] as const;
const MAX_OPTIONS = 5;

export type ActionMenuDialogIcon = (typeof ALLOWED_ICONS)[number];

export interface ActionMenuDialogOption {
  id: string;
  label: string;
  icon: ActionMenuDialogIcon;
}

export interface ActionMenuDialogParams {
  options: ActionMenuDialogOption[];
}

export interface ActionMenuDialogResult {
  selectedOptionId: string | null;
}

function sanitizeOption(option: unknown, handlerName: string): ActionMenuDialogOption {
  if (!option || typeof option !== "object") {
    throw new TypeError(`Invalid params for ${handlerName}: each option must be an object.`);
  }

  const { id, label, icon } = option as Partial<ActionMenuDialogOption>;

  if (typeof id !== "string" || typeof label !== "string") {
    throw new TypeError(
      `Invalid params for ${handlerName}: option 'id' and 'label' must be strings.`,
    );
  }

  const trimmedId = id.trim();
  const trimmedLabel = label.trim();

  if (!trimmedId || !trimmedLabel) {
    throw new Error(
      `Invalid params for ${handlerName}: option 'id' and 'label' must be non-empty.`,
    );
  }

  if (!icon || !ALLOWED_ICONS.includes(icon)) {
    throw new Error(
      `Invalid params for ${handlerName}: option 'icon' must be one of ${ALLOWED_ICONS.join(", ")}.`,
    );
  }

  return { id: trimmedId, label: trimmedLabel, icon };
}

export function sanitizeActionMenuDialogParams(
  params: ActionMenuDialogParams | undefined,
  handlerName: string,
): ActionMenuDialogParams {
  // Params come from live apps without validation on reception, so the signature alone is not enough.
  if (!params || typeof params !== "object" || !Array.isArray(params.options)) {
    throw new TypeError(`Invalid params for ${handlerName}: 'options' must be an array.`);
  }

  if (params.options.length === 0 || params.options.length > MAX_OPTIONS) {
    throw new Error(
      `Invalid params for ${handlerName}: 'options' must contain between 1 and ${MAX_OPTIONS} items.`,
    );
  }

  const options = params.options.map(option => sanitizeOption(option, handlerName));

  if (new Set(options.map(({ id }) => id)).size !== options.length) {
    throw new Error(`Invalid params for ${handlerName}: option 'id' values must be unique.`);
  }

  return { options };
}
