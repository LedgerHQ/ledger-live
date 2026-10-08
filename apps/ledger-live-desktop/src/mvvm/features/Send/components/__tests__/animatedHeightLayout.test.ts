/**
 * @jest-environment jsdom
 */
import {
  isAnimatedHeightCapped,
  measureStackedHeight,
  readAvailableHeight,
  resolveAnimatedHeight,
} from "../animatedHeightLayout";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");

function mockOffsetHeight() {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return Number((this as HTMLElement).dataset.h ?? 0);
    },
  });
}

describe("animatedHeightLayout", () => {
  beforeEach(() => {
    mockOffsetHeight();
  });

  afterEach(() => {
    if (originalOffsetHeight) {
      Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    }
  });

  it("should keep a short recipient list at its content height", () => {
    expect(resolveAnimatedHeight(280, 536)).toBe(280);
    expect(isAnimatedHeightCapped(280, 536)).toBe(false);
  });

  it("should cap a long contact list at the dialog max height", () => {
    expect(resolveAnimatedHeight(980, 536)).toBe(536);
    expect(isAnimatedHeightCapped(980, 536)).toBe(true);
  });

  it("should measure stacked content instead of a stretched flex column", () => {
    const root = document.createElement("div");
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.dataset.h = "536";

    const header = document.createElement("div");
    header.dataset.h = "64";

    const body = document.createElement("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.minHeight = "156px";
    body.dataset.h = "400";

    const contacts = document.createElement("div");
    contacts.dataset.h = "720";
    body.append(contacts);
    root.append(header, body);
    document.body.append(root);

    expect(measureStackedHeight(root)).toBe(64 + 720);

    root.remove();
  });

  it("should keep the dialog body minimum when the list is shorter than it", () => {
    const body = document.createElement("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.minHeight = "156px";
    body.dataset.h = "156";

    const contacts = document.createElement("div");
    contacts.dataset.h = "40";
    body.append(contacts);

    expect(measureStackedHeight(body)).toBe(156);
  });

  it("should subtract dialog padding and ignore the status gradient", () => {
    const dialog = document.createElement("div");
    dialog.style.boxSizing = "border-box";
    dialog.style.maxHeight = "560px";
    dialog.style.paddingBottom = "24px";

    const gradient = document.createElement("div");
    gradient.style.position = "absolute";
    gradient.dataset.h = "560";

    const content = document.createElement("div");
    content.dataset.h = "200";
    dialog.append(gradient, content);
    document.body.append(dialog);

    expect(readAvailableHeight(content)).toBe(536);

    dialog.remove();
  });
});
