/**
 * Native locator factories — match strategy named at construction, returning
 * an action-ready {@link NativeHandle}. `byId("x").tap()` vs `byText("x").tap()`;
 * never a bare string assumed to be a testID.
 */
import { by } from "detox";
import { NativeHandle } from "./handle";

/** Match by `testID` (the React Native testID prop → Detox `by.id`). */
export const byId = (id: string): NativeHandle => new NativeHandle(by.id(id));
/** Match by visible text. */
export const byText = (text: string): NativeHandle => new NativeHandle(by.text(text));
/** Match by accessibilityLabel (iOS) / contentDescription (Android). */
export const byLabel = (label: string): NativeHandle => new NativeHandle(by.label(label));
/** Match by view type / semantic type. */
export const byType = (type: string): NativeHandle => new NativeHandle(by.type(type));
/** Wrap an arbitrary matcher — regex ids, `by.id(...).withAncestor(...)`, etc. */
export const byMatcher = (matcher: Detox.NativeMatcher): NativeHandle => new NativeHandle(matcher);
