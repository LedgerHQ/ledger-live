import { assertRendererNamespace } from "./rendererNamespaces";

describe("assertRendererNamespace", () => {
  it("should accept the app namespace", () => {
    expect(() => assertRendererNamespace("app")).not.toThrow();
  });

  it.each(["windowParams", "../../secrets", "app/../x", "", undefined, 1])(
    "should reject %p",
    ns => {
      expect(() => assertRendererNamespace(ns)).toThrow("not allowed from the renderer");
    },
  );
});
