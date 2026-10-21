import { DEVTOOLS_WINDOW_NAME } from "~/config/devToolsWindow";

const WINDOW_TITLE = "Ledger Wallet DevTools";

let current: Window | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(listener => listener());

export const subscribeDevToolsWindow = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getDevToolsWindow = () => current;

function cloneStyleNode(node: Node, target: Document): Node | null {
  if (node instanceof HTMLLinkElement && node.rel === "stylesheet") {
    const link = target.createElement("link");
    link.rel = "stylesheet";
    link.href = node.href;
    return link;
  }
  if (node instanceof HTMLStyleElement) {
    const style = target.createElement("style");
    // Production styled-components inject through insertRule, leaving textContent empty.
    style.textContent = node.sheet
      ? Array.from(node.sheet.cssRules, rule => rule.cssText).join("\n")
      : node.textContent;
    return style;
  }
  return null;
}

function mirrorStyles(source: Document, target: Document) {
  const append = (node: Node) => {
    const clone = cloneStyleNode(node, target);
    if (clone) target.head.appendChild(clone);
  };
  source.head.childNodes.forEach(append);
  target.documentElement.className = source.documentElement.className;

  const headObserver = new MutationObserver(mutations =>
    mutations.forEach(mutation => mutation.addedNodes.forEach(append)),
  );
  headObserver.observe(source.head, { childList: true });

  const themeObserver = new MutationObserver(() => {
    target.documentElement.className = source.documentElement.className;
  });
  themeObserver.observe(source.documentElement, { attributes: true, attributeFilter: ["class"] });

  return () => {
    headObserver.disconnect();
    themeObserver.disconnect();
  };
}

export function openDevToolsWindow() {
  if (current && !current.closed) {
    current.focus();
    return;
  }
  const popup = window.open("about:blank", DEVTOOLS_WINDOW_NAME);
  if (!popup) return;

  popup.document.title = WINDOW_TITLE;
  Object.assign(popup.document.body.style, {
    margin: "0",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
  });
  const stopMirroring = mirrorStyles(document, popup.document);

  const closePopup = () => popup.close();
  window.addEventListener("beforeunload", closePopup);
  popup.addEventListener("pagehide", () => {
    stopMirroring();
    window.removeEventListener("beforeunload", closePopup);
    if (current === popup) {
      current = null;
      emit();
    }
  });

  current = popup;
  emit();
}

export function closeDevToolsWindow() {
  current?.close();
}
