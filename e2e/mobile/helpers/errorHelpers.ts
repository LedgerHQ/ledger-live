export const ERROR_MODAL_SELECTORS = ["generic-error-modal"] as const;

export async function detectErrorModal(timeout: number = 1000): Promise<string | null> {
  for (const errorSelector of ERROR_MODAL_SELECTORS) {
    const isErrorVisible = await IsIdVisible(errorSelector, timeout);
    if (isErrorVisible) {
      return errorSelector;
    }
  }
  return null;
}

export async function checkForErrorModals(
  timeout: number = 1000,
  customMessage?: string,
): Promise<void> {
  const detectedError = await detectErrorModal(timeout);

  if (detectedError) {
    const baseMessage = customMessage || "Operation failed";
    throw new Error(
      `${baseMessage}: Error modal detected (${detectedError}). Check the app for error details.`,
    );
  }
}

/**
 * Checks if an error element is visible on screen and throws if found.
 * Used for fail-fast behavior when waiting for elements.
 *
 * @param errorElementId - The test ID of the error element to check for
 * @param errorCheckTimeout - How long to wait when checking for the error element (in ms)
 * @throws {Error} If the error element is visible, with the error text if available
 */
export async function checkForErrorElement(
  errorElementId: string,
  errorCheckTimeout: number,
): Promise<void> {
  const hasError = await IsIdVisible(errorElementId, errorCheckTimeout);

  if (hasError) {
    const errorText = await getTextOfElement(errorElementId);
    throw new Error(
      errorText
        ? `Error detected while waiting for element: ${errorText}`
        : `Error element '${String(errorElementId)}' detected while waiting for element`,
    );
  }
}
