import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type TranslatedErrorMessages = {
  title: string;
  description: string;
};

/**
 * Hook to get translated error messages from a bridge Error object.
 * Uses the same i18n keys as TranslatedError component but returns strings.
 */
export function useTranslatedBridgeError(error: Error | undefined): TranslatedErrorMessages | null {
  const { t } = useTranslation();

  return useMemo(() => {
    if (!error || !(error instanceof Error)) {
      return null;
    }

    const errorName = error.name;
    const titleKey = `errors.${errorName}.title`;
    const descriptionKey = `errors.${errorName}.description`;

    // Get translation with error properties as arguments
    const args = {
      ...error,
      message: error.message,
    };

    const title = t(titleKey, args as Record<string, unknown>);
    const description = t(descriptionKey, args as Record<string, unknown>);

    // If translation key is returned as-is, use generic fallback
    const genericTitleKey = "errors.generic.title";
    const genericDescriptionKey = "errors.generic.description";

    return {
      title: title === titleKey ? t(genericTitleKey, args as Record<string, unknown>) : title,
      description:
        description === descriptionKey
          ? t(genericDescriptionKey, args as Record<string, unknown>)
          : description,
    };
  }, [error, t]);
}
