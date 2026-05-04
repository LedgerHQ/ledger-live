import { app, ipcMain, session, webContents } from "electron";
import { isUrlAllowedByManifestDomains } from "@ledgerhq/live-common/wallet-api/manifestDomainUtils";
import { openURL } from "./openURL";
import {
  WEBVIEW_GUEST_CSP,
  createLiveAppSchemeChecker,
  mergeCspHeaders,
} from "./webviewHandlers.helpers";

type WebviewHandlersGlobal = typeof globalThis & {
  __ledgerLiveWebviewHandlersSetup__?: boolean;
};

const webviewHandlersGlobal = globalThis as WebviewHandlersGlobal;

/**
 * Wires up all security-sensitive handlers for Live App <webview> guests
 * (CSP injection, external-protocol handoff guards, manifest-domain
 * whitelist, window-open routing).
 *
 * Enforces one-time setup during `app.on("ready", ...)` to avoid stacking
 * duplicate `onHeadersReceived`, `web-contents-created`, and IPC listeners.
 */
export function setupWebviewHandlers(supportedSchemes: string[]) {
  if (webviewHandlersGlobal.__ledgerLiveWebviewHandlersSetup__) {
    throw new Error("setupWebviewHandlers must only be called once");
  }
  webviewHandlersGlobal.__ledgerLiveWebviewHandlersSetup__ = true;

  // Tracks the active manifest-domain will-navigate handler per WebContents id
  // so we can remove only that specific listener on subsequent dom-ready
  // events, without disturbing any other will-navigate listeners that may
  // exist on the same WebContents.
  const willNavigateHandlers = new Map<number, (event: Electron.Event, url: string) => void>();

  // Tracks sessions we've already attached CSP + external-protocol hardening to,
  // so we don't register duplicate onHeadersReceived listeners when multiple
  // Live App webviews share the same session partition.
  const hardenedSessions = new WeakSet<Electron.Session>();

  const isLiveAppSchemeAllowed = createLiveAppSchemeChecker(supportedSchemes);

  // IPC from the renderer on webview `dom-ready`. Only the manifest-domain
  // whitelist lives here because it needs the renderer-supplied `domains`
  // array from the Live App manifest. This channel is only meant for guest
  // <webview> contents, so unexpected ids are ignored defensively. The
  // window-open handler and the scheme guard are registered earlier via
  // `web-contents-created` so they are in place BEFORE the guest's first
  // script runs.
  ipcMain.on("webview-dom-ready", (_, id: number, domains?: string[]) => {
    const wc = webContents.fromId(id);

    if (wc?.getType() !== "webview") return;

    // dom-ready fires on every reload - remove only the previously registered
    // handler for this WebContents to avoid listener accumulation without
    // touching other listeners.
    const previousHandler = willNavigateHandlers.get(id);
    if (previousHandler) {
      wc.off("will-navigate", previousHandler);
      willNavigateHandlers.delete(id);
    }

    // When manifest domains are provided (feature flag on), enforce origin whitelist on navigation
    if (Array.isArray(domains) && domains.length > 0) {
      const handler = (event: Electron.Event, url: string) => {
        if (!isUrlAllowedByManifestDomains(url, domains)) {
          event.preventDefault();
        }
      };
      wc.on("will-navigate", handler);
      willNavigateHandlers.set(id, handler);
    }
  });

  // Inject a restrictive Content-Security-Policy on document responses served
  // to any <webview> guest session. Chromium enforces `frame-src` before
  // attempting any external-protocol handoff, which is the only layer that can
  // block `<iframe src="itms-apps://...">` style exploits - Electron's JS
  // navigation events (`will-navigate`, `will-frame-navigate`,
  // `setWindowOpenHandler`, permission handlers, `shell.openExternal`,
  // `webRequest`) all bypass that code path.
  //
  // Multiple CSP headers are enforced as an intersection by the browser, so
  // adding ours on top of any CSP already returned by the Live App can only
  // further restrict, not relax, the effective policy.
  //
  // We attach on session-creation (rather than on `webview-dom-ready`) so the
  // handler is in place BEFORE the guest's first navigation request returns,
  // which is when the top-level document's CSP is parsed by Chromium.
  const hardenWebviewSession = (s: Electron.Session) => {
    if (hardenedSessions.has(s)) return;
    hardenedSessions.add(s);

    s.webRequest.onHeadersReceived((details, callback) => {
      // Only harden responses loaded by a guest <webview> to avoid affecting
      // the host renderer or unrelated BrowserViews. `getType()` returns
      // "webview" for guest WebContents.
      const isWebviewGuest = details.webContents?.getType() === "webview";
      const isFrameDocument =
        details.resourceType === "mainFrame" || details.resourceType === "subFrame";
      if (!isWebviewGuest || !isFrameDocument) {
        callback({});
        return;
      }

      callback({
        responseHeaders: mergeCspHeaders(details.responseHeaders, WEBVIEW_GUEST_CSP),
      });
    });
  };

  app.on("session-created", hardenWebviewSession);
  // Also harden any sessions that already exist (defaultSession + any
  // partitioned sessions that were spun up before this listener attached).
  hardenWebviewSession(session.defaultSession);

  // Per-WebContents hardening for Live App <webview> guests, attached on
  // `web-contents-created` so every listener is in place BEFORE the guest's
  // first navigation / first script runs. Registering these on
  // `webview-dom-ready` is too late: `dom-ready` does not fire for pages
  // that immediately navigate away (e.g. an inline `<script>` assigning
  // `window.location.href = "itms-apps://..."`), which would allow the
  // external-protocol handoff to run unchallenged. Calling
  // `event.preventDefault()` inside the scheme guard stops Chromium from
  // delegating the URL to the OS's external-protocol handler.
  app.on("web-contents-created", (_appEvent, contents) => {
    if (contents.getType() !== "webview") return;

    // Route same-tab `window.open` attempts: http(s) goes to the user's
    // default browser via `openURL`; everything else (including
    // `itms-apps:`, `javascript:`, malformed URLs) is denied.
    contents.setWindowOpenHandler(({ url }) => {
      try {
        const protocol = new URL(url).protocol;
        if (protocol === "https:" || protocol === "http:") {
          openURL(url);
        }
      } catch {
        // Malformed URL - fall through to deny.
      }
      return { action: "deny" };
    });

    // Clean up the per-WebContents manifest-domain handler exactly once when
    // the guest goes away, instead of stacking one-shot listeners on every
    // dom-ready / reload cycle. The authoritative cleanup site for the
    // `willNavigateHandlers` map is here.
    contents.once("destroyed", () => {
      willNavigateHandlers.delete(contents.id);
    });

    // Block disallowed schemes for:
    //   - `will-navigate`:       top-level navigations from link clicks / JS
    //   - `will-redirect`:       HTTP 3xx redirects (not covered by
    //                            `will-navigate`), e.g. a trusted https:// URL
    //                            that 302s to itms-apps://
    //   - `will-frame-navigate`: subframe navigations that `will-navigate`
    //                            skips, as a belt-and-braces layer on top of
    //                            the CSP frame-src policy injected above.
    //
    // All three events expose the target URL directly on the event object
    // in modern Electron, so a single guard function covers every signature.
    const schemeGuard = (event: Electron.Event<{ url: string }>) => {
      if (!isLiveAppSchemeAllowed(event.url)) {
        event.preventDefault();
      }
    };
    contents.on("will-navigate", schemeGuard);
    contents.on("will-redirect", schemeGuard);
    contents.on("will-frame-navigate", schemeGuard);
  });
}
