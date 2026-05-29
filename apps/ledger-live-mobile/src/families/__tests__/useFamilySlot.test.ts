import { createFamilySlotHook } from "../useFamilySlot";

describe("createFamilySlotHook", () => {
  it("getCached/preload return undefined for missing family or loader", async () => {
    const hook = createFamilySlotHook(new Map());
    expect(hook.getCached(undefined)).toBeUndefined();
    expect(hook.getCached("unknown")).toBeUndefined();
    await expect(hook.preload(undefined)).resolves.toBeUndefined();
    await expect(hook.preload("unknown")).resolves.toBeUndefined();
  });

  it("preload loads once and caches the resolved value for getCached", async () => {
    const impl = { tag: "impl" };
    const loader = jest.fn(() => Promise.resolve({ default: impl }));
    const hook = createFamilySlotHook(new Map([["evm", loader]]));

    expect(hook.getCached("evm")).toBeUndefined();
    await expect(hook.preload("evm")).resolves.toBe(impl);
    await hook.preload("evm");
    expect(loader).toHaveBeenCalledTimes(1);
    expect(hook.getCached("evm")).toBe(impl);
  });

  it("getCached returns undefined when the load rejected", async () => {
    const loader = jest.fn(() => Promise.reject(new Error("boom")));
    const hook = createFamilySlotHook(new Map([["evm", loader]]));

    await expect(hook.preload("evm")).rejects.toThrow("boom");
    expect(hook.getCached("evm")).toBeUndefined();
  });
});
