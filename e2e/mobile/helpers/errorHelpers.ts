import { TIMEOUT } from "@e2e/utils/timeouts";
import { byId } from "@e2e/helpers/elements/native";

const ERROR_MODAL_SELECTORS = ["generic-error-modal"] as const;

async function detectErrorModal(timeout: number = TIMEOUT.xxsmall): Promise<string | null> {
  for (const errorSelector of ERROR_MODAL_SELECTORS) {
    const isErrorVisible = await byId(errorSelector).isVisible(timeout);
    if (isErrorVisible) {
      return errorSelector;
    }
  }
  return null;
}

export async function checkForErrorModals(
  timeout: number = TIMEOUT.xxsmall,
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
