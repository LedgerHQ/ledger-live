import { readFileSync } from "fs";
import { join } from "path";
import { GLOW_DEFAULTS, GLOW_FADE_MS, type GlowParams } from "../glowParams";

const packageRoot = join(__dirname, "../..");
const read = (path: string) => readFileSync(join(packageRoot, path), "utf8");
const METAL = read("ios/glow.msl");
const GLSL = read("android/src/main/assets/uiglow/glow.glsl");
const KOTLIN = read("android/src/main/java/com/ledger/uiglow/GlowView.kt");
const KOTLIN_MANAGER = read("android/src/main/java/com/ledger/uiglow/GlowViewManager.kt");
const OBJC = read("ios/RCTGlowView.mm");

const PARAMS = Object.keys(GLOW_DEFAULTS) as (keyof GlowParams)[];
const COMPONENTS = ["x", "y", "z", "w"];

/** `grainSize` → `P_GRAIN_SIZE`, the name of its `#define` in both shaders. */
function defineName(param: string): string {
  return `P_${param.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}`;
}

function defineOf(source: string, param: string): string | undefined {
  return new RegExp(`#define ${defineName(param)}\\s+(\\S+)`).exec(source)?.[1];
}

/** The param that GlowView.kt writes to each GLSL uniform slot: `uLook.y` → `opacity`. */
function kotlinSlots(): Map<string, string> {
  const uniformNames = /UNIFORM_NAMES = listOf\(([^)]*)\)/.exec(KOTLIN)?.[1].match(/"\w+"/g) ?? [];
  const slots = new Map<string, string>();
  const calls = KOTLIN.matchAll(/glUniform(?:4f|1f)\(uniforms\[(\d+)\], ((?:p\.\w+(?:, )?)+)\)/g);
  for (const [, index, args] of calls) {
    const uniform = uniformNames[Number(index)].replaceAll('"', "");
    const params = args.split(", ").map(arg => arg.replace("p.", ""));
    params.forEach((param, i) => {
      slots.set(params.length === 1 ? uniform : `${uniform}.${COMPONENTS[i]}`, param);
    });
  }
  return slots;
}

/** `grainSize` → `glowGrainSize`, its native prop. */
function propName(param: string): string {
  return `glow${param[0].toUpperCase()}${param.slice(1)}`;
}

/** The field names of a C struct body, in order: `float res[2];` → `res`. */
function structFields(body: string | undefined): string[] {
  return [...(body ?? "").matchAll(/^\s*float\d?\s+(\w+)/gm)].map(([, name]) => name);
}

function numberAfter(source: string, pattern: RegExp): number {
  return Number(pattern.exec(source)?.[1]);
}

describe("glow shaders", () => {
  const slots = kotlinSlots();

  it.each(PARAMS)("should read %s from its own named field on iOS", param => {
    expect(defineOf(METAL, param)).toBe(`u.${param}`);
  });

  it.each(PARAMS)("should read %s from the GLSL slot that GlowView.kt fills with it", param => {
    const slot = defineOf(GLSL, param);
    expect(slot).toBeDefined();
    expect(slots.get(slot ?? "")).toBe(param);
  });

  it("should give the uniforms the same fields in the same order on iOS", () => {
    const shaderFields = structFields(/struct Uniforms \{([^}]*)\}/.exec(METAL)?.[1]);
    expect(shaderFields).toEqual(expect.arrayContaining(PARAMS));
    expect(structFields(/typedef struct \{([^}]*)\} GlowUniforms/.exec(OBJC)?.[1])).toEqual(
      shaderFields,
    );
  });

  it.each(PARAMS)("should copy the %s prop to its uniform on iOS", param => {
    expect(OBJC).toContain(`_params.${param} = newProps.${propName(param)};`);
  });

  it.each(PARAMS)("should copy the %s prop to its param on Android", param => {
    const setter = new RegExp(
      `fun set${propName(param).replace("g", "G")}\\([^)]*\\) \\{\\s*view\\.params = view\\.params\\.copy\\(${param} = value\\)`,
    );
    expect(KOTLIN_MANAGER).toMatch(setter);
  });

  it("should fade each glow in GLOW_FADE_MS on both platforms", () => {
    expect(numberAfter(OBJC, /kFade = ([\d.]+);/) * 1000).toBe(GLOW_FADE_MS);
    expect(numberAfter(KOTLIN, /const val FADE = ([\d.]+)/) * 1000).toBe(GLOW_FADE_MS);
  });
});
