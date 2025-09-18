import { Registry } from "../Registry";
import { of, Observable } from "rxjs";

describe("Registry", () => {
  let registry: Registry<string>;

  beforeEach(() => {
    registry = new Registry<string>();
  });

  describe("Basic operations", () => {
    it("should register and get items", () => {
      registry.register("test-id", "test-value");
      expect(registry.get("test-id")).toBe("test-value");
    });

    it("should unregister items", () => {
      registry.register("test-id", "test-value");
      expect(registry.unregister("test-id")).toBe(true);
      expect(registry.get("test-id")).toBeUndefined();
    });

    it("should clear all items", () => {
      registry.register("id1", "value1");
      registry.register("id2", "value2");
      registry.clear();
      expect(registry.size()).toBe(0);
    });

    it("should return correct size", () => {
      expect(registry.size()).toBe(0);
      registry.register("id1", "value1");
      expect(registry.size()).toBe(1);
    });
  });

  describe("Callbacks and Observables", () => {
    it("should handle callbacks", () => {
      const callbackRegistry = new Registry<(...args: unknown[]) => void>();
      const mockCallback = jest.fn();

      callbackRegistry.register("callback", mockCallback);
      const callback = callbackRegistry.get("callback");

      if (callback) {
        callback();
      }

      expect(mockCallback).toHaveBeenCalled();
    });

    it("should handle observables", () => {
      const observableRegistry = new Registry<Observable<unknown>>();
      const mockData = [{ id: "1", name: "Test" }];
      const mockObservable = of(mockData);

      observableRegistry.register("observable", mockObservable);
      const observable = observableRegistry.get("observable");

      if (observable) {
        const subscriber = jest.fn();
        observable.subscribe(subscriber);
        expect(subscriber).toHaveBeenCalledWith(mockData);
      }
    });
  });
});
