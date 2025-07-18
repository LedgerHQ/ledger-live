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
