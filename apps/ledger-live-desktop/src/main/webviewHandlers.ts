import { app, ipcMain, session, webContents } from "electron";
import {
  getReportableOrigin,
  type DomainCheckKind,
  type DomainCheckOutcome,
  type DomainCheckViolation,
} from "@ledgerhq/live-common/wallet-api/manifestDomainReport";
import { openURL } from "./openURL";
import {
  WEBVIEW_GUEST_CSP,
  applyWebviewAttachPolicy,
  createLiveAppSchemeChecker,
  createMainFrameOriginChecker,
  getLoggableOrigin,
  isBridgeSenderFrameAllowed,
  isWebviewBridgeChannel,
  mergeCspHeaders,
  takeAllowedOrigins,
  takeDomainCheckReport,
} from "./webviewHandlers.helpers";
import { CHANNELS, type WebviewBridgeMessage } from "~/bridge/contract";
import type {
  WebviewAllowedOrigins,
  WebviewDomainCheckReport,
} from "~/bridge/webviewAllowedOrigins";

type WebviewHandlersGlobal = typeof globalThis & {
  __ledgerLiveWebviewHandlersSetup__?: boolean;
};

const webviewHandlersGlobal = globalThis as WebviewHandlersGlobal;

// Electron 42 made guest-side DevTools capture unreliable, so discovery happens
// app-wide and ownership is re-derived when a Live App <webview> is destroyed.
const trackedDevToolsContents = new Set<Electron.WebContents>();

const isDevToolsContents = (contents: Electron.WebContents) => {
  try {
    return (
      !contents.isDestroyed() &&
      contents.getType() === "remote" &&
      // `devtools://` is a stable, localization-independent signal; the exact
      // "DevTools" title is kept as a fallback in case the URL isn't populated yet.
      (contents.getURL().startsWith("devtools://") || contents.getTitle() === "DevTools")
    );
  } catch {
    return false;
  }
};

const findDevToolsOwner = (
  devToolsContents: Electron.WebContents,
): Electron.WebContents | undefined => {
  try {
    return webContents
      .getAllWebContents()
      .find(wc => !wc.isDestroyed() && wc.devToolsWebContents === devToolsContents);
  } catch {
    return undefined;
  }
};

const trackDevToolsForGuest = (contents: Electron.WebContents) => {
  if (!isDevToolsContents(contents)) return;
  const owner = findDevToolsOwner(contents);
  if (owner && owner.getType() !== "webview") {
    trackedDevToolsContents.delete(contents);
    return;
  }
  trackedDevToolsContents.add(contents);
};

/**
 * Force-closes tracked, still-alive guest DevTools WebContents.
 *
 * When `guestId` is provided, only DevTools whose owner resolves to that guest
 * are closed. Ownership is re-derived here (more reliable once the DevTools
 * document has loaded than at discovery): a non-<webview> owner is dropped and
 * left alone (protecting the developer's own DevTools, even on an app-wide
 * close), a different still-alive guest is left for its own teardown, and an
 * unattributable owner is closed as the deliberate Electron 42 safety net.
 *
 * Called from the main process when a Live App <webview> guest is destroyed.
 */
export function closeTrackedWebviewDevTools(guestId?: number) {
  for (const contents of trackedDevToolsContents) {
    if (contents.isDestroyed()) {
      trackedDevToolsContents.delete(contents);
      continue;
    }
    const owner = findDevToolsOwner(contents);
    if (owner && owner.getType() !== "webview") {
      trackedDevToolsContents.delete(contents);
      continue;
    }
    if (guestId !== undefined && owner && owner.id !== guestId) continue;
    try {
      contents.close();
    } catch {
      trackedDevToolsContents.delete(contents);
    }
  }
}

type GuestDomainCheckReport = {
  manifestId: string;
  /** Strict manifest domains; `undefined` when the renderer sent none (no report-only check). */
  strictDomains: string[] | undefined;
  report: (violation: DomainCheckViolation) => void;
};

/**
 * Hands a guest's violations to its embedder, which sends them to Datadog: main has no
 * Datadog SDK. The embedder deduplicates them, once it knows whether Datadog recorded them.
 */
const createGuestDomainCheckReport = (
  guest: Electron.WebContents,
  context: WebviewDomainCheckReport | undefined,
): GuestDomainCheckReport => ({
  manifestId: context?.manifestId ?? "unknown",
  strictDomains: context?.domains,
  report: violation => {
    const embedder = guest.hostWebContents;
    if (!embedder || embedder.isDestroyed()) return;
    embedder.send(CHANNELS.webviewDomainCheckViolation, violation);
  },
});

/**
 * Wires up all security-sensitive handlers for Live App <webview> guests
 * (CSP injection, external-protocol handoff guards, manifest-domain
 * whitelist, window-open routing).
 *
 * Enforces one-time setup during `app.on("ready", ...)` to avoid stacking
 * duplicate `onHeadersReceived`, `web-contents-created`, `onBeforeRequest` and IPC listeners.
 */
export function setupWebviewHandlers(supportedSchemes: string[]) {
  if (webviewHandlersGlobal.__ledgerLiveWebviewHandlersSetup__) {
    throw new Error("setupWebviewHandlers must only be called once");
  }
  webviewHandlersGlobal.__ledgerLiveWebviewHandlersSetup__ = true;

  // Allowed main-frame origins per guest WebContents id, from the Live App
  // manifest. A guest with no entry fails closed.
  const allowedOriginsByGuest = new Map<number, WebviewAllowedOrigins>();

  // Set by `will-attach-webview` and bound by `web-contents-created`, which
  // Electron emits synchronously while creating that same guest, before its
  // first load (`did-attach-webview` only fires after that load has started).
  let pendingAllowedOrigins: WebviewAllowedOrigins | undefined;
  let pendingDomainCheckReport: WebviewDomainCheckReport | undefined;

  const domainCheckReportByGuest = new Map<number, GuestDomainCheckReport>();

  // Tracks sessions we've already attached CSP + external-protocol hardening to,
  // so we don't register duplicate onHeadersReceived listeners when multiple
  // Live App webviews share the same session partition.
  const hardenedSessions = new WeakSet<Electron.Session>();

  const isLiveAppSchemeAllowed = createLiveAppSchemeChecker(supportedSchemes);
  const isMainFrameUrlAllowed = createMainFrameOriginChecker(supportedSchemes);

  const isGuestMainFrameUrlAllowed = (guestId: number, url: string) =>
    isMainFrameUrlAllowed(url, allowedOriginsByGuest.get(guestId));

  const reportMainFrame = (
    guestId: number,
    url: string,
    outcome: DomainCheckOutcome,
    kind: DomainCheckKind = "navigation",
  ) => {
    const guestReport = domainCheckReportByGuest.get(guestId);
    guestReport?.report({
      origin: getReportableOrigin(url),
      manifestId: guestReport.manifestId,
      appVersion: app.getVersion(),
      platform: "desktop",
      frameType: "main_frame",
      kind,
      outcome,
    });
  };

  // Report-only: a main frame the current check allows but the strict manifest
  // domains would not, so the lists can be fixed before the check tightens.
  const reportIfStrictlyDisallowed = (
    guestId: number,
    url: string,
    kind: DomainCheckKind = "navigation",
  ) => {
    const strictDomains = domainCheckReportByGuest.get(guestId)?.strictDomains;
    if (strictDomains === undefined || isMainFrameUrlAllowed(url, strictDomains)) return;
    reportMainFrame(guestId, url, "would_block", kind);
  };

  // Live App bridge messages (Wallet API, Platform API, dapp provider) from the guest preload.
  // The sender is identified here, from the frame that sent the message, not from the guest:
  // only its main frame on an allowed origin reaches the embedder, tagged with that origin.
  ipcMain.on(CHANNELS.webviewBridgeMessage, (event, channel: unknown, message: unknown) => {
    const guest = event.sender;
    if (guest.getType() !== "webview" || !isWebviewBridgeChannel(channel)) return;

    const frame = event.senderFrame;
    const embedder = guest.hostWebContents;
    if (!frame || !embedder || embedder.isDestroyed()) return;

    const sender = { origin: frame.origin, isMainFrame: frame.parent === null };
    if (!isBridgeSenderFrameAllowed(sender, allowedOriginsByGuest.get(guest.id))) {
      console.warn("Dropped a Live App bridge message from a disallowed frame", {
        origin: getLoggableOrigin(sender.origin),
        isMainFrame: sender.isMainFrame,
      });
      return;
    }

    // Report-only: a sender the check accepts but the strict manifest domains would not.
    reportIfStrictlyDisallowed(guest.id, sender.origin, "bridge");

    const bridgeMessage: WebviewBridgeMessage = {
      guestId: guest.id,
      origin: sender.origin,
      channel,
      message,
    };
    embedder.send(CHANNELS.webviewBridgeMessage, bridgeMessage);
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

    // Electron keeps a single `onBeforeRequest` listener per session, so both
    // frame-load guards share this one. Subresources are left out: Chromium
    // already refuses `file:` ones to web origins, and the manifest check is
    // about the main frame.
    s.webRequest.onBeforeRequest(
      { urls: ["<all_urls>"], types: ["mainFrame", "subFrame"] },
      (details, callback) => {
        const guest = details.webContents;
        if (guest?.getType() !== "webview") {
          callback({});
          return;
        }

        // A guest never needs a local file, and the embedder can point one at it with
        // `src` or `loadURL()`, neither of which fires `will-navigate`.
        if (details.url.startsWith("file:")) {
          callback({ cancel: true });
          return;
        }

        // Every main-frame load goes through here: the first `src`, `loadURL()`,
        // link clicks, redirects and back/forward.
        if (details.resourceType === "mainFrame") {
          if (!isGuestMainFrameUrlAllowed(guest.id, details.url)) {
            reportMainFrame(guest.id, details.url, "blocked");
            callback({ cancel: true });
            return;
          }
          reportIfStrictlyDisallowed(guest.id, details.url);
        }

        callback({});
      },
    );
  };

  app.on("session-created", hardenWebviewSession);
  // Also harden any sessions that already exist (defaultSession + any
  // partitioned sessions that were spun up before this listener attached).
  hardenWebviewSession(session.defaultSession);

  const guardWebviewAttach = (embedder: Electron.WebContents) => {
    embedder.on("will-attach-webview", (event, webPreferences, params) => {
      const allowedOrigins = takeAllowedOrigins(webPreferences);
      const domainCheckReport = takeDomainCheckReport(webPreferences);
      const allowed = applyWebviewAttachPolicy(webPreferences, params.src, {
        appDir: __dirname,
        isSrcAllowed: isLiveAppSchemeAllowed,
      });
      if (!allowed) {
        console.warn("Blocked a <webview> with a disallowed src", params.src);
        event.preventDefault();
        pendingAllowedOrigins = undefined;
        pendingDomainCheckReport = undefined;
        return;
      }
      pendingAllowedOrigins = allowedOrigins;
      pendingDomainCheckReport = domainCheckReport;
    });
  };

  // The main window already exists when this runs, so guard it as well as later windows.
  for (const contents of webContents.getAllWebContents()) {
    if (contents.getType() === "window") guardWebviewAttach(contents);
  }

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
    const contentsType = contents.getType();

    if (contentsType === "window") guardWebviewAttach(contents);

    if (contentsType === "remote") {
      // DevTools ownership is usually available once the DevTools document loads.
      contents.on("page-title-updated", () => {
        trackDevToolsForGuest(contents);
      });
      contents.once("destroyed", () => {
        trackedDevToolsContents.delete(contents);
      });
    }

    if (contentsType !== "webview") return;

    // The origins the guest is created with apply for its whole life, even if
    // the domain check flag changes while it is open.
    const allowedOrigins = pendingAllowedOrigins;
    pendingAllowedOrigins = undefined;
    if (allowedOrigins !== undefined) {
      allowedOriginsByGuest.set(contents.id, allowedOrigins);
    }
    domainCheckReportByGuest.set(
      contents.id,
      createGuestDomainCheckReport(contents, pendingDomainCheckReport),
    );
    pendingDomainCheckReport = undefined;

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

    contents.once("destroyed", () => {
      allowedOriginsByGuest.delete(contents.id);
      domainCheckReportByGuest.delete(contents.id);
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

    // Early cancels of the main-frame origin check enforced in `onBeforeRequest`.
    const mainFrameOriginGuard = (event: Electron.Event<{ url: string; isMainFrame: boolean }>) => {
      if (event.isMainFrame && !isGuestMainFrameUrlAllowed(contents.id, event.url)) {
        reportMainFrame(contents.id, event.url, "blocked");
        event.preventDefault();
      }
    };
    contents.on("will-navigate", mainFrameOriginGuard);
    contents.on("will-redirect", mainFrameOriginGuard);

    // Backstop for main-frame commits that skip the request hook (e.g. pages
    // restored from the back/forward cache): move the guest off the page, which
    // also drops its bridge context.
    contents.on(
      "did-frame-navigate",
      (_event, url, _httpResponseCode, _httpStatusText, isMainFrame) => {
        if (!isMainFrame) return;
        if (isGuestMainFrameUrlAllowed(contents.id, url)) {
          reportIfStrictlyDisallowed(contents.id, url);
          return;
        }
        reportMainFrame(contents.id, url, "blocked");
        contents.loadURL("about:blank").catch(() => {
          // Superseded by another navigation, which goes through the same checks.
        });
      },
    );
  });
}
