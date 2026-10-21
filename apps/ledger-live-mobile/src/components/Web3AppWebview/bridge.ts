import { useMemo } from "react";
import type { WebViewMessageEvent } from "react-native-webview";
import {
  type BridgeSender,
  getBridgeOrigin,
  isBridgeSenderAllowed,
} from "@ledgerhq/live-common/wallet-api/bridgeSession";

/** The sending frame, as reported by the native WebView (never by the page). */
export function getMessageSender({ nativeEvent }: WebViewMessageEvent): BridgeSender {
  return { url: nativeEvent.url, isMainFrame: nativeEvent.isMainFrame };
}

/**
 * Identifies the sender of a WebView message: only the main frame on an allowed origin is
 * answered. Returns the origin of the sender, `undefined` when the message is dropped.
 */
export function getAllowedSenderOrigin(
  event: WebViewMessageEvent,
  allowedDomains: string[] | undefined,
): string | undefined {
  const sender = getMessageSender(event);
  const origin = getBridgeOrigin(sender.url);
  if (!origin || !isBridgeSenderAllowed(sender, allowedDomains)) {
    console.warn("Dropped a Live App bridge message from a disallowed frame", {
      origin: origin ?? "opaque",
      isMainFrame: sender.isMainFrame,
    });
    return undefined;
  }
  return origin;
}

/**
 * Android `addWebMessageListener` origin rules for the manifest domains: the bridge object is
 * only injected in frames on those origins. A scheme-wide domain (`https://`, `https://*`) has no
 * equivalent rule, so it falls back to any origin, still checked in JS.
 */
export function getMessagingAllowedOrigins(domains: string[] | undefined): string[] | undefined {
  if (domains === undefined) return undefined;
  const rules = new Set<string>();
  for (const domain of domains) {
    const match = /^(https?):\/\/(\*\.|\*)?([^/*:]*)(:\d+)?$/.exec(domain.trim());
    if (!match) continue;
    const [, scheme, wildcard, host, port = ""] = match;
    if (!host) {
      if (wildcard !== "*." && port === "") return undefined;
      continue;
    }
    if (wildcard === "*") continue;
    rules.add(`${scheme}://${wildcard ?? ""}${host}${port}`);
  }
  return [...rules];
}

/** `manifest.domains` when the domain check is on, `undefined` (any origin) otherwise. */
export function useBridgeAllowedDomains(
  domains: string[] | undefined,
  manifestDomainCheckEnabled: boolean | undefined,
): string[] | undefined {
  return useMemo(
    () => (manifestDomainCheckEnabled ? (domains ?? []) : undefined),
    [domains, manifestDomainCheckEnabled],
  );
}
