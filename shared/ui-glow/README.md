# @shared/ui-glow

> [!CAUTION]
> **Status: UNSTABLE**. New package, in trial (tech radar "Shader Effects", DLS ADR 026).

An animated GPU glow with film grain, for full-screen backgrounds: a glow at the top and one at the bottom. It is a native Fabric view (Metal on iOS, OpenGL ES 2.0 on Android), so no JS runs per frame.

## Entries

| Entry | Status |
| --- | --- |
| `@shared/ui-glow/native` | React Native implementation (`src/native/`) |
| `@shared/ui-glow/web` | Not yet. It will draw the same GLSL with WebGL and implement the same props contract (`src/Glow.types.ts`). |

## Usage

```tsx
import { Glow } from "@shared/ui-glow/native";

<Glow showTop={!isDone} showBottom={isDone} delayMs={300} fallback={<StaticGlow />} />
```

- `showTop` / `showBottom`: the glow at each edge (default: top only). A change waits `delayMs`, then takes 1 s. Both glows fade (ease in and out) at the same time, so a swap is a crossfade.
- `params`: overrides of `GLOW_DEFAULTS`, the knobs from the designer's playground (`GlowParams`).
- `fallback`: a static glow, shown only if the shader cannot run.

Each glow keeps its height and only drifts side to side. Reduce motion (the OS setting) stops the clock and makes fades instant.

## How it works

| Part | File |
| --- | --- |
| Shader, source of truth (GLSL ES 1.00) | `src/shaders/glow.glsl.ts` |
| Metal port (keep in sync) | `src/shaders/glow.metal.ts` |
| Codegen spec | `src/native/specs/GlowViewNativeComponent.ts` |
| iOS view (`MTKView`) | `ios/RCTGlowView.mm` |
| Android view (`GLSurfaceView`) | `android/src/main/java/com/ledger/uiglow/` |

- The shader is a JS string compiled at runtime: a shader change needs no native rebuild. The first compile happens on the first display (then it is cached), so the glow fades in once it is ready.
- Both glows are drawn in one GPU pass; a hidden glow is skipped.
- Pixel ratio is capped at 2. Rendering stops when the view leaves the window.
- Never name a native prop `position`, `top` or `bottom`: Fabric reads them as Yoga layout props.

The native code started from [benchmark-shader-solutions](https://github.com/gre/benchmark-shader-solutions) (`rn-native-compatible-dynamic`).

## Native setup

None. The app lists `@shared/ui-glow` in its `package.json`; autolinking finds the podspec (`SharedUiGlow`) and the Android library (`com.ledger.uiglow`). Codegen runs during `pod install` and the Gradle build.
