import {
  capturePreviouslyFocusedElement,
  restorePreviouslyFocusedElement,
} from "./liveAppModalFocus";

describe("liveAppModalFocus", () => {
  describe("capturePreviouslyFocusedElement", () => {
    it("returns the element when activeElement is an HTMLElement", () => {
      const button = document.createElement("button");
      expect(capturePreviouslyFocusedElement(button)).toBe(button);
    });

    it("returns null when activeElement is not an HTMLElement", () => {
      const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      expect(capturePreviouslyFocusedElement(svgElement)).toBeNull();
    });
  });

  describe("restorePreviouslyFocusedElement", () => {
    it("focuses the element when it is still connected to the document", () => {
      const button = document.createElement("button");
      document.body.appendChild(button);
      const focusSpy = jest.spyOn(button, "focus");

      restorePreviouslyFocusedElement(button);

      expect(focusSpy).toHaveBeenCalledTimes(1);
      button.remove();
    });

    it("does not focus when the element is null", () => {
      const focusSpy = jest.spyOn(HTMLElement.prototype, "focus");

      restorePreviouslyFocusedElement(null);

      expect(focusSpy).not.toHaveBeenCalled();
      focusSpy.mockRestore();
    });

    it("does not focus when the element is no longer connected", () => {
      const button = document.createElement("button");
      const focusSpy = jest.spyOn(button, "focus");

      restorePreviouslyFocusedElement(button);

      expect(focusSpy).not.toHaveBeenCalled();
    });
  });
});
