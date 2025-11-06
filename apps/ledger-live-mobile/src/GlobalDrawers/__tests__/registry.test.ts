import { DRAWER_REGISTRY, DRAWER_ENTRIES } from "../registry";
import { ModularDrawerWrapper } from "LLM/features/ModularDrawer";
import ReceiveDrawerWrapper from "LLM/features/Receive/drawers/ReceiveFundsOptionsDrawer";

describe("GlobalDrawers Registry", () => {
  it("should contain all expected drawer entries with correct components", () => {
    expect(DRAWER_REGISTRY.modular).toBeDefined();
    expect(DRAWER_REGISTRY.modular.component).toBe(ModularDrawerWrapper);

    expect(DRAWER_REGISTRY.receive).toBeDefined();
    expect(DRAWER_REGISTRY.receive.component).toBe(ReceiveDrawerWrapper);
  });

  it("should have all entries with valid structure", () => {
    Object.entries(DRAWER_REGISTRY).forEach(([key, entry]) => {
      expect(key).toBeTruthy();
      expect(entry.component).toBeDefined();
      expect(typeof entry.component).toBe("function");
    });
  });

  it("should generate DRAWER_ENTRIES array correctly from registry", () => {
    expect(Array.isArray(DRAWER_ENTRIES)).toBe(true);
    expect(DRAWER_ENTRIES).toHaveLength(Object.keys(DRAWER_REGISTRY).length);

    const registryMap = new Map(Object.entries(DRAWER_REGISTRY));

    DRAWER_ENTRIES.forEach(entry => {
      expect(entry.key).toBeDefined();
      expect(entry.component).toBeDefined();

      const registryEntry = registryMap.get(entry.key);
      expect(registryEntry).toBeDefined();
      expect(entry.component).toBe(registryEntry?.component);
    });
  });

  it("should maintain consistency between registry keys and entries", () => {
    const registryKeys = Object.keys(DRAWER_REGISTRY).sort();
    const entriesKeys = DRAWER_ENTRIES.map(entry => entry.key).sort();

    expect(entriesKeys).toEqual(registryKeys);
  });
});
