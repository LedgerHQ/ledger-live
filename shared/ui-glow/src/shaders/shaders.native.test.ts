import { GLOW_PARAM_ORDER } from "../glowParams";
import { GLOW_GLSL } from "./glow.glsl";
import { GLOW_METAL } from "./glow.metal";

const GLSL_COMPONENTS = ["x", "y", "z", "w"];

/** `grainSize` → `P_GRAIN_SIZE`, the name of its `#define` in both shaders. */
function defineName(param: string): string {
  return `P_${param.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}`;
}

/** The uniform slot each `#define P_*` reads: `uP[1].z` (GLSL) and `u.p[6]` (Metal) are both 6. */
function slotsOf(source: string, pattern: RegExp): Map<string, number> {
  const slots = new Map<string, number>();
  for (const match of source.matchAll(pattern)) {
    const [, name, index, component] = match;
    const slot = component ? Number(index) * 4 + GLSL_COMPONENTS.indexOf(component) : Number(index);
    slots.set(name, slot);
  }
  return slots;
}

describe("glow shaders", () => {
  const glsl = slotsOf(GLOW_GLSL, /#define (P_\w+)\s+uP\[(\d)\]\.([xyzw])/g);
  const metal = slotsOf(GLOW_METAL, /#define (P_\w+)\s+u\.p\[(\d+)\]/g);

  it.each(GLOW_PARAM_ORDER.map((param, slot) => [param, slot] as const))(
    "should read %s from slot %i in both shaders, like toUniformArray",
    (param, slot) => {
      expect(glsl.get(defineName(param))).toBe(slot);
      expect(metal.get(defineName(param))).toBe(slot);
    },
  );
});
