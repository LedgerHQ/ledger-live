/**
 * Codegen spec of the Fabric component <GlowView> (package.json `codegenConfig`).
 * Native views: ios/RCTGlowView.mm (Metal), android/.../GlowView.kt (OpenGL ES 2.0).
 * The clock, the fades and reduce motion are native: no JS runs per frame.
 */
import { codegenNativeComponent } from "react-native";
import type { CodegenTypes, HostComponent, ViewProps } from "react-native";

export type GlowErrorEvent = Readonly<{ message: string }>;

export interface NativeProps extends ViewProps {
  /** Shader source, compiled at runtime: Metal on iOS, GLSL ES 1.00 on Android. */
  source: string;
  /** The `uP[]` uniform, in GLOW_PARAM_ORDER. */
  params: ReadonlyArray<CodegenTypes.Float>;
  /**
   * The top and bottom glows. A change takes 1 s; both run at once, so a swap is a crossfade.
   * Instant with reduce motion. Never name a prop `position`, `top` or `bottom`: Fabric reads
   * those keys as Yoga layout props.
   */
  showTop?: CodegenTypes.WithDefault<boolean, true>;
  showBottom?: CodegenTypes.WithDefault<boolean, false>;
  /** Wait before a show change starts. */
  delayMs?: CodegenTypes.WithDefault<CodegenTypes.Double, 0>;
  onShaderError?: CodegenTypes.DirectEventHandler<GlowErrorEvent>;
}

export default codegenNativeComponent<NativeProps>("GlowView") as HostComponent<NativeProps>;
