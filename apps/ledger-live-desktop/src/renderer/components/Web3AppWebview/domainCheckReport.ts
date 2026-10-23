import {
  DOMAIN_CHECK_VIOLATION_ACTION,
  createDomainCheckReporter,
  getReportableOrigin,
  type DomainCheckViolation,
} from "@ledgerhq/live-common/wallet-api/manifestDomainReport";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { addAction } from "~/datadog/renderer";
import { webview } from "~/renderer/bridge";

const sendToDatadog = (violation: DomainCheckViolation) =>
  addAction(DOMAIN_CHECK_VIOLATION_ACTION, violation);

// Main forwards every violation: a violation Datadog could not record (RUM not initialized
// yet) is not marked as reported, so a later occurrence is sent.
const reportViolation = createDomainCheckReporter(sendToDatadog);

/**
 * Sends the main-frame violations the main process sees to Datadog, once each.
 */
export function startDomainCheckViolationReporting(): () => void {
  return webview.onDomainCheckViolation(reportViolation);
}

/**
 * Reports a Live App the domain check keeps on about:blank because neither its initial
 * URL nor manifest.url is in manifest.domains: main never sees that load.
 */
export function reportBlockedInitialLoad(manifest: LiveAppManifest, url: string): void {
  reportViolation({
    origin: getReportableOrigin(url),
    manifestId: manifest.id,
    appVersion: __APP_VERSION__,
    platform: "desktop",
    frameType: "main_frame",
    kind: "navigation",
    outcome: "blocked",
  });
}
