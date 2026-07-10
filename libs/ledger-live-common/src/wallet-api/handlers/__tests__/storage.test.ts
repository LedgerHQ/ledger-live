import { createStorageGetHandler, createStorageSetHandler } from "../storage";
import { getDepsFrom, makeHandlerDeps } from "./testHelpers";

describe("storage handlers", () => {
  const manifest = (overrides = {}) => ({
    ...makeHandlerDeps().manifest,
    id: "app-id",
    ...overrides,
  });

  describe("createStorageGetHandler", () => {
    it("throws when the UI handler is not configured", () => {
      const handler = createStorageGetHandler(getDepsFrom(makeHandlerDeps()));
      expect(() => handler({ key: "k", storeId: "app-id" })).toThrow(
        "storage.get UI handler not configured",
      );
    });

    it("delegates to the UI handler when storeId matches the manifest id", () => {
      const uiStorageGet = jest.fn(() => "value");
      const handler = createStorageGetHandler(
        getDepsFrom(makeHandlerDeps({ uiStorageGet, manifest: manifest() })),
      );

      const result = handler({ key: "k", storeId: "app-id" });

      expect(result).toBe("value");
      expect(uiStorageGet).toHaveBeenCalledWith({
        key: "k",
        storeId: "app-id",
      });
    });

    it("delegates when storeId is in the manifest storage allowlist", () => {
      const uiStorageGet = jest.fn(() => "value");
      const handler = createStorageGetHandler(
        getDepsFrom(
          makeHandlerDeps({
            uiStorageGet,
            manifest: manifest({ storage: ["shared"] }),
          }),
        ),
      );

      expect(handler({ key: "k", storeId: "shared" })).toBe("value");
      expect(uiStorageGet).toHaveBeenCalledTimes(1);
    });

    it("blocks access to a storeId outside the manifest permissions", () => {
      const uiStorageGet = jest.fn();
      const handler = createStorageGetHandler(
        getDepsFrom(makeHandlerDeps({ uiStorageGet, manifest: manifest() })),
      );

      expect(() => handler({ key: "k", storeId: "other" })).toThrow(
        'Live App "app-id" is not permitted to access storage "other".',
      );
      expect(uiStorageGet).not.toHaveBeenCalled();
    });
  });

  describe("createStorageSetHandler", () => {
    it("throws when the UI handler is not configured", () => {
      const handler = createStorageSetHandler(getDepsFrom(makeHandlerDeps()));
      expect(() => handler({ key: "k", value: "v", storeId: "app-id" })).toThrow(
        "storage.set UI handler not configured",
      );
    });

    it("delegates to the UI handler when storeId matches the manifest id", () => {
      const uiStorageSet = jest.fn();
      const handler = createStorageSetHandler(
        getDepsFrom(makeHandlerDeps({ uiStorageSet, manifest: manifest() })),
      );

      handler({ key: "k", value: "v", storeId: "app-id" });

      expect(uiStorageSet).toHaveBeenCalledWith({
        key: "k",
        value: "v",
        storeId: "app-id",
      });
    });

    it("blocks access to a storeId outside the manifest permissions", () => {
      const uiStorageSet = jest.fn();
      const handler = createStorageSetHandler(
        getDepsFrom(makeHandlerDeps({ uiStorageSet, manifest: manifest() })),
      );

      expect(() => handler({ key: "k", value: "v", storeId: "other" })).toThrow(
        'Live App "app-id" is not permitted to access storage "other".',
      );
      expect(uiStorageSet).not.toHaveBeenCalled();
    });
  });
});
