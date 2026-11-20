import type { RumConfigurationOptions } from "@datadog/mobile-react-native";
import { containsIdentifiers, scrubResourceUrl } from "@features/platform-observability-redaction";

type ResourceEventMapper = NonNullable<RumConfigurationOptions["resourceEventMapper"]>;
type RequestType = typeof XMLHttpRequest;

const DATADOG_TRACKING_CONTEXT = "_datadog_xhr";
const REACT_NATIVE_REQUEST_URL = "_url";

type TrackedRequest = XMLHttpRequest & {
  [DATADOG_TRACKING_CONTEXT]?: { url?: unknown };
  [REACT_NATIVE_REQUEST_URL]?: unknown;
};

const requestTypesWithScrubbing = new WeakSet<RequestType>();

/**
 * Scrubs the URL the Datadog SDK reports for each tracked request, when the request is sent.
 * Install it once, before the SDK starts tracking resources.
 */
export function scrubTrackedRequestUrls(
  requestType: RequestType | undefined = globalThis.XMLHttpRequest,
): void {
  if (!requestType || requestTypesWithScrubbing.has(requestType)) return;
  requestTypesWithScrubbing.add(requestType);

  const send = requestType.prototype.send;
  requestType.prototype.send = function sendWithScrubbedUrl(
    this: TrackedRequest,
    ...args: Parameters<XMLHttpRequest["send"]>
  ) {
    const tracking = this[DATADOG_TRACKING_CONTEXT];
    if (tracking && typeof tracking.url === "string") {
      tracking.url = scrubResourceUrl(tracking.url);
    }
    return send.apply(this, args);
  };
}

const isKnownUrl = (url: unknown): url is string => typeof url === "string" && url !== "";

const urlOf = (request: TrackedRequest): string | undefined =>
  [
    request[DATADOG_TRACKING_CONTEXT]?.url,
    request.responseURL,
    request[REACT_NATIVE_REQUEST_URL],
  ].find(isKnownUrl);

/** Drops a resource whose URL is unknown or still holds an identifier. */
export const customResourceEventMapper: ResourceEventMapper = event => {
  try {
    const request: TrackedRequest | undefined = event.resourceContext;
    const url = request && urlOf(request);
    return url !== undefined && !containsIdentifiers(url) ? event : null;
  } catch {
    return null;
  }
};
