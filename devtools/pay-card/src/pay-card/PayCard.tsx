import type { PayCardToolProps } from "../types";

/**
 * Platform-neutral default export for the Card / Pay DevTool.
 *
 * The foundation package (LIVE-35496) ships the shared props contract, the view
 * model and the registry wiring. The concrete UIs are delivered separately and
 * take precedence through `.web` / `.native` module resolution:
 * - web: `PayCard.web.tsx` (LIVE-35510)
 * - native: `PayCard.native.tsx` (LIVE-35511)
 *
 * Until a platform view exists, the tool renders nothing.
 */
export function PayCard(_props: Readonly<PayCardToolProps>) {
  return null;
}

export default PayCard;
