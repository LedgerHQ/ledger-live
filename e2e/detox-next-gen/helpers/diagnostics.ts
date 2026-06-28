/**
 * Failure diagnostics — the artifacts captured when a spec fails so a human (or
 * an AI agent) can root-cause without re-running. Wired into the failure path
 * (`test_fn_failure` / `hook_failure`) of the suite's jest.environment.ts.
 *
 * The headline artifact is a single **merged view hierarchy**: Detox's native
 * tree (with testIDs injected) plus — spliced in at the native WebView node —
 * the live-app webview's own DOM. The native tree is *blind* inside a webview,
 * which is exactly where the swap flow lives; nesting the DOM under its WebView
 * node yields one tree you can drill from native chrome straight down into the
 * rendered web content, with the boundary made explicit.
 *
 * It is attached to the Allure report — on the failing test's result, or (for a
 * `beforeAll` failure) the suite container's setup. See docs/debugging.md.
 */
import { device, web, by } from "detox";
import { allure } from "jest-allure2-reporter/api";

/** Bound every device/webview call so a wedged app can't hang teardown. */
const CAPTURE_TIMEOUT = 15_000;

/** Race a promise against a timeout; the timer is unref'd so it never holds the loop open. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    timer.unref?.();
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Capture the merged native + webview view hierarchy and attach it to the Allure
 * report (it lands on the failing test's result, or — for a `beforeAll` failure —
 * the suite container's setup). Best-effort by design: a native-only failure (no
 * webview mounted) yields just the native tree, and an unreadable native tree is
 * logged and swallowed so it never masks the original test failure.
 */
export async function captureViewHierarchy(
  label = "View hierarchy at failure (native + webview DOM)",
): Promise<void> {
  let xml: string;
  try {
    xml = await nativeHierarchyXml();
  } catch (error) {
    console.warn(`captureViewHierarchy: native hierarchy unavailable — ${String(error)}`);
    return;
  }

  try {
    const dom = await withTimeout(captureWebviewDom(), CAPTURE_TIMEOUT, "captureWebviewDom");
    if (dom) xml = spliceDomIntoWebViewNode(xml, dom);
  } catch {
    // No webview mounted (or DOM unreadable) — keep the native-only hierarchy.
  }

  const withDom = xml.includes("<webview-dom") ? "included" : "absent";
  try {
    await allure.attachment(label, xml, "text/xml");
    console.info(`captureViewHierarchy: attached ${xml.length} bytes (webview DOM ${withDom})`);
  } catch (error) {
    console.warn(`captureViewHierarchy: could not attach hierarchy — ${String(error)}`);
  }
}

/**
 * The native hierarchy XML with testIDs injected (`true`) — the single biggest
 * debugging win, since a failing locator's testID becomes matchable against the
 * tree. Falls back to the plain hierarchy if injection ever throws, so the
 * artifact is never lost over that one feature.
 */
async function nativeHierarchyXml(): Promise<string> {
  try {
    return await withTimeout(
      device.generateViewHierarchyXml(true),
      CAPTURE_TIMEOUT,
      "generateViewHierarchyXml(true)",
    );
  } catch (error) {
    console.warn(
      `captureViewHierarchy: testID-injected hierarchy failed, retrying without injection — ${String(error)}`,
    );
    return withTimeout(
      device.generateViewHierarchyXml(),
      CAPTURE_TIMEOUT,
      "generateViewHierarchyXml",
    );
  }
}

/** Read the live-app webview's `<body>` outerHTML, or null when no webview is present. */
async function captureWebviewDom(): Promise<string | null> {
  const result = await web.element(by.web.tag("body")).runScript("(el) => el.outerHTML");
  // Detox sometimes wraps a runScript return as `{ result }` — normalise both shapes.
  if (typeof result === "string") return result || null;
  if (result && typeof result === "object" && "result" in result) {
    const inner = (result as { result: unknown }).result;
    return typeof inner === "string" ? inner || null : null;
  }
  return null;
}

/**
 * Splice the webview DOM into the native XML as the first child of the WebView
 * node — iOS exposes it as a `*WebView*` element (e.g. `RNCWebView`), Android as
 * a `<node class="…WebView…">`. The DOM is wrapped in CDATA so its HTML stays
 * opaque to XML parsers. If no WebView node is found the DOM is appended with a
 * marker comment, so it is never silently lost.
 */
function spliceDomIntoWebViewNode(nativeXml: string, dom: string): string {
  const block = webviewDomBlock(dom);
  // Walk opening tags; pick the first that looks like a webview by tag name
  // (iOS) or a `class="…WebView…"` attribute (Android `<node>`). The attribute
  // alternations let a quoted `>` inside an attr value not end the tag early.
  const tagRe = /<([A-Za-z_][\w.:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  for (let m = tagRe.exec(nativeXml); m; m = tagRe.exec(nativeXml)) {
    const [full, name, attrs, selfClose] = m;
    const isWebView = /webview/i.test(name) || /class\s*=\s*"[^"]*webview[^"]*"/i.test(attrs);
    if (!isWebView) continue;

    if (selfClose === "/") {
      // `<WebView … />` → `<WebView …>{dom}</WebView>`
      const opened = full.replace(/\/>$/, ">");
      return (
        nativeXml.slice(0, m.index) +
        `${opened}\n${block}\n</${name}>` +
        nativeXml.slice(m.index + full.length)
      );
    }
    // `<WebView …>` → insert the DOM right after the opening tag (first child).
    const after = m.index + full.length;
    return nativeXml.slice(0, after) + `\n${block}` + nativeXml.slice(after);
  }
  return `${nativeXml}\n<!-- no WebView node in native hierarchy; webview DOM appended -->\n${block}`;
}

/** Wrap the DOM in a CDATA-guarded `<webview-dom>` element, neutralising any literal `]]>`. */
function webviewDomBlock(dom: string): string {
  const safe = dom.replace(/]]>/g, "]]]]><![CDATA[>");
  return `<webview-dom note="DOM of the embedded live-app webview, nested at its native WebView node">\n<![CDATA[\n${safe}\n]]>\n</webview-dom>`;
}
