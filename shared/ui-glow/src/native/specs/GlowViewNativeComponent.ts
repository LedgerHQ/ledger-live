/**
 * Codegen spec of the Fabric component <GlowView> (package.json `codegenConfig`).
 * Native views: ios/RCTGlowView.mm (Metal, ios/glow.msl), android/.../GlowView.kt (OpenGL ES 2.0,
 * android/src/main/assets/uiglow/glow.glsl). The shaders ship with the app, not with JS.
 * The clock, the fades and reduce motion are native: no JS runs per frame.
 */
import { codegenNativeComponent } from "react-native";
import type { CodegenTypes, HostComponent, ViewProps } from "react-native";

export type GlowErrorEvent = Readonly<{ message: string }>;

export interface NativeProps extends ViewProps {
  // The design params (GlowParams), one typed prop each, so codegen gives each a named setter.
  // Prefixed: `opacity` and `width` are View and Yoga props, like `position`, `top` and `bottom`.
  glowIntensity: CodegenTypes.Float;
  glowOpacity: CodegenTypes.Float;
  glowGrain: CodegenTypes.Float;
  glowGrainSize: CodegenTypes.Float;
  glowChroma: CodegenTypes.Float;
  glowSoftness: CodegenTypes.Float;
  glowWidth: CodegenTypes.Float;
  glowReach: CodegenTypes.Float;
  glowTopReach: CodegenTypes.Float;
  glowDark: CodegenTypes.Float;
  glowSpreadX: CodegenTypes.Float;
  glowBalance: CodegenTypes.Float;
  glowContrast: CodegenTypes.Float;
  /**
   * The top and bottom glows. A change takes 1 s; both run at once, so a swap is a crossfade.
   * Instant with reduce motion. Never name a prop like a View or Yoga prop (`position`, `top`,
   * `bottom`, `width`, `opacity`…): Fabric reads those keys as layout or view props.
   */
  showTop?: CodegenTypes.WithDefault<boolean, true>;
  showBottom?: CodegenTypes.WithDefault<boolean, false>;
  /** Wait before a show change starts. */
  delayMs?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  onShaderError?: CodegenTypes.DirectEventHandler<GlowErrorEvent>;
}

export default codegenNativeComponent<NativeProps>("GlowView") as HostComponent<NativeProps>;
