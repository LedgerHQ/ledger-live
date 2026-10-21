import {
  DOMAIN_CHECK_VIOLATION_ACTION,
  createDomainCheckReporter,
  getReportableOrigin,
  isUrlAllowedByStrictManifestDomains,
  type DomainCheckViolation,
} from "@ledgerhq/live-common/wallet-api/manifestDomainReport";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { addAction } from "~/datadog/renderer";
import { webview } from "~/renderer/bridge";

const sendToDatadog = (violation: DomainCheckViolation) => {
  addAction(DOMAIN_CHECK_VIOLATION_ACTION, violation);
};

const reportBridgeViolation = createDomainCheckReporter(sendToDatadog);

/**
 * Sends the main-frame violations the main process sees to Datadog. Main already
 * reports each one once per guest.
 */
export function startDomainCheckViolationReporting(): () => void {
  return webview.onDomainCheckViolation(sendToDatadog);
}

/**
 * Report-only: flags a Wallet API / Platform API message sent from a main frame the
 * strict manifest domains would reject. The preload only runs in the main frame, so its
 * current URL is the sender.
 */
export function reportBridgeSenderOrigin(manifest: LiveAppManifest, senderUrl: string): void {
  if (isUrlAllowedByStrictManifestDomains(senderUrl, manifest.domains)) return;
  reportBridgeViolation({
    origin: getReportableOrigin(senderUrl),
    manifestId: manifest.id,
    appVersion: __APP_VERSION__,
    platform: "desktop",
    frameType: "main_frame",
    kind: "bridge",
    outcome: "would_block",
  });
}
