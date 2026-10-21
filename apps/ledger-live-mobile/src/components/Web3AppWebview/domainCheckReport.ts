import { Platform } from "react-native";
import { DdRum, RumActionType } from "@datadog/mobile-react-native";
import {
  DOMAIN_CHECK_VIOLATION_ACTION,
  createDomainCheckReporter,
  getReportableOrigin,
  isUrlAllowedByStrictManifestDomains,
  type DomainCheckFrameType,
  type DomainCheckKind,
  type DomainCheckOutcome,
} from "@ledgerhq/live-common/wallet-api/manifestDomainReport";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { appVersion } from "LLM/utils/appVersion";
import { isDatadogRecording } from "~/datadog";

// Not recorded (no consent, flag off, SDK not ready): the violation is sent again next time.
const report = createDomainCheckReporter(violation => {
  if (!isDatadogRecording()) return false;
  DdRum.addAction(RumActionType.CUSTOM, DOMAIN_CHECK_VIOLATION_ACTION, violation).catch(() => {
    // Reporting is best effort.
  });
});

type DomainCheckEvent = {
  manifest: Pick<LiveAppManifest, "id" | "domains">;
  url: string;
  frameType: DomainCheckFrameType;
  kind: DomainCheckKind;
};

/**
 * Sends a manifest domain check violation to Datadog, once per app, origin and outcome.
 * Only the origin of `url` leaves the device.
 */
export function reportDomainCheckViolation({
  manifest,
  url,
  frameType,
  kind,
  outcome,
}: DomainCheckEvent & { outcome: DomainCheckOutcome }): void {
  report({
    origin: getReportableOrigin(url),
    manifestId: manifest.id,
    appVersion,
    platform: Platform.OS === "ios" ? "ios" : "android",
    frameType,
    kind,
    outcome,
  });
}

/**
 * Report-only: flags a main-frame URL or bridge sender the strict manifest domains
 * would reject, whether or not the domain check is on.
 */
export function reportIfStrictlyDisallowed(event: DomainCheckEvent): void {
  if (!event.url || event.url === "about:blank") return;
  if (isUrlAllowedByStrictManifestDomains(event.url, event.manifest.domains)) return;
  reportDomainCheckViolation({ ...event, outcome: "would_block" });
}
