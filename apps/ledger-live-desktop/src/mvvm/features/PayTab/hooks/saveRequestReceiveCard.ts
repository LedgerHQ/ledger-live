import { ipcRenderer } from "electron";
import { toPng } from "html-to-image";
import logger from "~/renderer/logger";

const CARD_SELECTOR = '[data-testid="pay-card-request-receive-card"]';
const BASE64_PNG_PREFIX = /^data:image\/png;base64,/;

/**
 * Captures the on-screen request card (QR + header + address) to a PNG and persists it through the
 * native OS save dialog. The image write happens in the main process (see the `save-png` handler)
 * so the renderer never touches the filesystem directly.
 */
export async function saveRequestReceiveCard(ticker: string, dialogTitle: string): Promise<void> {
  try {
    const node = document.querySelector<HTMLElement>(CARD_SELECTOR);
    if (!node) {
      return;
    }

    const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
    const base64 = dataUrl.replace(BASE64_PNG_PREFIX, "");

    await ipcRenderer.invoke(
      "save-png",
      {
        title: dialogTitle,
        defaultPath: `ledger-request-${ticker || "card"}.png`,
        filters: [{ name: "PNG Image", extensions: ["png"] }],
      },
      base64,
    );
  } catch (error) {
    logger.error(error);
  }
}
