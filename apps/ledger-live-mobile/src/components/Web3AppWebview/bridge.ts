import { type RefObject, useCallback, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import type { WebView, WebViewMessageEvent } from "react-native-webview";
import {
  type BridgeSender,
  type BridgeSession,
  type BridgeSessionController,
  getBridgeOrigin,
  isBridgeSenderAllowed,
  useBridgeSession,
} from "@ledgerhq/live-common/wallet-api/bridgeSession";

/** A JS string literal of `value`, line separators included. */
const toScriptLiteral = (value: string) =>
  JSON.stringify(value)
    .replaceAll("\u2028", String.raw`\u2028`)
    .replaceAll("\u2029", String.raw`\u2029`);

/**
 * Dispatches `message` like react-native-webview's `postMessage` (on `window` on iOS, on
 * `document` on Android), only if the main frame document is still on `targetOrigin` when the
 * script runs: a reply never reaches a document on another origin.
 */
export function buildOriginBoundMessageScript(
  message: string,
  targetOrigin: string,
  target: "window" | "document" = Platform.OS === "android" ? "document" : "window",
): string {
  return `(function () {
  if (window.location.origin !== ${toScriptLiteral(targetOrigin)}) return;
  ${target}.dispatchEvent(new MessageEvent("message", { data: ${toScriptLiteral(message)} }));
})();
true;`;
}

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
 * Returns the session a WebView message belongs to, `undefined` when it is dropped: only the
 * main frame on an allowed origin is answered.
 */
export function acceptWebviewMessage(
  event: WebViewMessageEvent,
  allowedDomains: string[] | undefined,
  accept: BridgeSessionController["accept"],
): BridgeSession | undefined {
  const origin = getAllowedSenderOrigin(event, allowedDomains);
  return origin === undefined ? undefined : accept(origin);
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
    // The host is a name, an IPv4 address or a bracketed IPv6 address ("http://[::1]:3000").
    const match = /^(https?):\/\/(\*\.|\*)?(\[[\da-f:.]+\]|[^/*:[\]]*)(:\d+)?$/i.exec(
      domain.trim(),
    );
    if (!match) continue;
    const [, scheme, wildcard, host, port = ""] = match;
    if (!host) {
      if (wildcard !== "*." && port === "") return undefined;
      continue;
    }
    if (wildcard === "*" || (wildcard && host.startsWith("["))) continue;
    rules.add(`${scheme}://${wildcard ?? ""}${host}${port}`);
  }
  return [...rules];
}

/**
 * The bridge session of a Live App WebView. When the main frame moves to another origin,
 * `onReset` closes the flows the Live App opened.
 */
export function useWebviewBridgeSession(
  webviewRef: RefObject<WebView | null>,
  mainFrameUrl: string,
  onReset: () => void,
): BridgeSessionController {
  const postMessage = useCallback(
    (message: string, targetOrigin: string) => {
      const webview = webviewRef.current;
      if (!webview) {
        console.warn("The Live App bridge tried to reply before the webview was initialized.");
        return;
      }
      webview.injectJavaScript(buildOriginBoundMessageScript(message, targetOrigin));
    },
    [webviewRef],
  );

  const bridge = useBridgeSession({ postMessage, onReset });

  const { onMainFrameNavigation } = bridge;
  useEffect(() => {
    onMainFrameNavigation(mainFrameUrl);
  }, [mainFrameUrl, onMainFrameNavigation]);

  return bridge;
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
