import {
  closeDevToolsWindow,
  getDevToolsWindow,
  openDevToolsWindow,
  subscribeDevToolsWindow,
} from "../devToolsWindow";

const createPopup = () => {
  const popupDocument = document.implementation.createHTMLDocument("");
  const popupWindow = new EventTarget();
  return Object.assign(popupWindow, {
    document: popupDocument,
    closed: false,
    focus: jest.fn(),
    close: jest.fn(() => popupWindow.dispatchEvent(new Event("pagehide"))),
  });
};

describe("devToolsWindow", () => {
  let popup: ReturnType<typeof createPopup>;
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    popup = createPopup();
    openSpy = jest.spyOn(window, "open").mockImplementation(() => popup as unknown as Window);
  });

  afterEach(() => {
    closeDevToolsWindow();
    openSpy.mockRestore();
  });

  it("opens a named blank popup and notifies subscribers", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeDevToolsWindow(listener);

    openDevToolsWindow();

    expect(openSpy).toHaveBeenCalledWith("about:blank", "ledger-devtools");
    expect(getDevToolsWindow()).toBe(popup);
    expect(popup.document.title).toBe("Ledger Wallet DevTools");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("copies the host styles and theme class into the popup", () => {
    const style = document.createElement("style");
    style.textContent = ".devtools-test { color: red; }";
    document.head.appendChild(style);
    document.documentElement.className = "dark";

    openDevToolsWindow();

    expect(popup.document.head.innerHTML).toContain(".devtools-test");
    expect(popup.document.documentElement.className).toBe("dark");
    style.remove();
  });

  it("focuses the existing popup instead of opening another one", () => {
    openDevToolsWindow();
    openDevToolsWindow();

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(popup.focus).toHaveBeenCalledTimes(1);
  });

  it("forgets the popup once it is closed", () => {
    openDevToolsWindow();

    closeDevToolsWindow();

    expect(getDevToolsWindow()).toBeNull();
  });
});
