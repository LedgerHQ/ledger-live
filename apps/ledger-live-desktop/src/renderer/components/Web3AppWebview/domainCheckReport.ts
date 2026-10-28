import { log } from "@ledgerhq/logs";
import {
  DOMAIN_CHECK_VIOLATION_ACTION,
  createDomainCheckReporter,
  getReportableOrigin,
  type DomainCheckViolation,
} from "@ledgerhq/live-common/wallet-api/manifestDomainReport";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { addAction } from "~/datadog/renderer";
import { webview } from "~/renderer/bridge";

export const DOMAIN_CHECK_LOG_TYPE = "live-app/domain-check";

const sendToDatadog = (violation: DomainCheckViolation) =>
  addAction(DOMAIN_CHECK_VIOLATION_ACTION, violation);

// Main forwards every violation: a violation Datadog could not record (RUM not initialized
// yet) is not marked as reported, so a later occurrence is sent.
const sendViolationToDatadog = createDomainCheckReporter(sendToDatadog);

// Exported logs keep each distinct violation once, so a page retrying a blocked load in a
// loop cannot push other logs out of the capped export buffer.
const createDomainCheckLogger = (message: string) =>
  createDomainCheckReporter(violation => log(DOMAIN_CHECK_LOG_TYPE, message, violation));

const logViolation = createDomainCheckLogger("violation");
const logGoToURLFallback = createDomainCheckLogger("goToURL rejected, loading manifest.url");
const logRejectedLoadURL = createDomainCheckLogger("loadURL rejected");

const reportViolation = (violation: DomainCheckViolation) => {
  logViolation(violation);
  sendViolationToDatadog(violation);
};

const blockedMainFrameNavigation = (manifestId: string, url: string): DomainCheckViolation => ({
  origin: getReportableOrigin(url),
  manifestId,
  appVersion: __APP_VERSION__,
  platform: "desktop",
  frameType: "main_frame",
  kind: "navigation",
  outcome: "blocked",
});

/**
 * Sends the main-frame violations the main process sees to Datadog and the exported logs, once each.
 */
export function startDomainCheckViolationReporting(): () => void {
  return webview.onDomainCheckViolation(reportViolation);
}

/**
 * Reports a Live App the domain check keeps on about:blank because neither its initial
 * URL nor manifest.url is in manifest.domains: main never sees that load.
 */
export function reportBlockedInitialLoad(manifest: LiveAppManifest, url: string): void {
  reportViolation(blockedMainFrameNavigation(manifest.id, url));
}

/** Logs a `goToURL` input the initial URL validation replaced with manifest.url. */
export function reportGoToURLFallback(manifestId: string, url: string): void {
  logGoToURLFallback(blockedMainFrameNavigation(manifestId, url));
}

/** Logs a `loadURL` call the domain check rejected before it reached the webview. */
export function reportRejectedLoadURL(manifestId: string, url: string): void {
  logRejectedLoadURL(blockedMainFrameNavigation(manifestId, url));
}
