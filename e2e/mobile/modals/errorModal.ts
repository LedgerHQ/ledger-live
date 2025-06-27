/**
 * Error Modal Detection Utilities
 * Provides reusable functions for detecting and handling error modals in e2e tests
 */

/**
 * List of common error modal testIDs that can appear across the app
 */
export const ERROR_MODAL_SELECTORS = ["generic-error-modal"] as const;

/**
 * Checks if any error modal is currently visible
 * @param timeout - Timeout in milliseconds for each selector check (default: 1000ms)
 * @returns Promise<string | null> - Returns the selector of the first error modal found, or null if none found
 */
export async function detectErrorModal(timeout: number = 1000): Promise<string | null> {
  for (const errorSelector of ERROR_MODAL_SELECTORS) {
    const isErrorVisible = await IsIdVisible(errorSelector, timeout);
    if (isErrorVisible) {
      return errorSelector;
    }
  }
  return null;
}

/**
 * Checks for error modals and throws an error if any are found
 * @param timeout - Timeout in milliseconds for each selector check (default: 1000ms)
 * @param customMessage - Custom error message prefix (optional)
 * @throws Error if any error modal is detected
 */
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
 * Waits for an error modal to appear
 * @param maxWaitTime - Maximum time to wait in milliseconds (default: 10000ms)
 * @param checkInterval - Interval between checks in milliseconds (default: 500ms)
 * @returns Promise<string> - Returns the selector of the error modal that appeared
 * @throws Error if no error modal appears within the timeout
 */
export async function waitForErrorModal(
  maxWaitTime: number = 10000,
  checkInterval: number = 500,
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const detectedError = await detectErrorModal(100);
    if (detectedError) {
      return detectedError;
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  throw new Error(`No error modal appeared within ${maxWaitTime}ms`);
}
