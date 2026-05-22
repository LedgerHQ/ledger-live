---
name: debug-rn-native-crash
description: Investigate native React Native crashes (Fabric/Hermes/iOS) in ledger-live-mobile when JS error logs are missing or unhelpful. Use when the app dies silently, throws an NSException on iOS, or shows only a native stack trace.
---

# Debug RN native crash

## Trigger

The mobile app crashes with one of:
- A native iOS exception (`NSInternalInconsistencyException`, `RCTFatal`, Fabric assertion)
- Only a native stack trace (`RCTViewComponentView`, `RCTPerformMountInstructions`, …) with no JS source
- "Failed to symbolicate" in Metro and no actionable JS error
- Reproducible crash but unclear which RN component is at fault

If the JS console already gives a clear stack, **don't use this skill** — read the JS error.

## Workflow

### 1. Capture the native exception from the simulator

```bash
xcrun simctl list devices booted   # get the booted sim UDID
xcrun simctl spawn <UDID> log show --last 5m --style compact \
  --predicate 'processImagePath CONTAINS "ledgerlivemobile" AND (eventMessage CONTAINS "Assertion failure" OR eventMessage CONTAINS "Attempt to unmount" OR eventMessage CONTAINS "Terminating app")'
```

Extract the exception message, native stack, and any view descriptors (`frame`, `tag`, `backgroundColor`, `alpha`). These already tell you a lot — see reference.md "Anatomy of a Fabric assertion message".

### 2. Reproduce under Xcode debugger

```bash
open apps/ledger-live-mobile/ios/ledgerlivemobile.xcworkspace
```

- Stop the running app first (otherwise Xcode can't attach cleanly).
- In Xcode: **Cmd+8 → +** → Exception Breakpoint → Objective-C → All.
- **Cmd+R** to build + run + attach.
- Reproduce the crash. Xcode pauses at `objc_exception_throw`.

### 3. Identify the offending React component

In the **lldb console** at the bottom of Xcode:

1. Pick the frame that has the offending C++/ObjC code:
   ```
   bt              # full backtrace, find the frame in RN code
   frame select N  # N = the RN frame (often RCTPerformMountInstructions)
   ```
2. Inspect the views referenced by the failed instruction. Variable names depend on the frame — read the source displayed in Xcode. Common ones:
   ```
   po parentViewDescriptor.view
   po oldChildViewDescriptor.view
   p  mutation.parentTag
   p  mutation.index
   p  oldChildShadowView.componentName
   ```
3. Find **where the orphan child is actually attached** vs where Fabric thinks:
   ```
   po [oldChildViewDescriptor.view superview]
   po [oldChildViewDescriptor.view accessibilityIdentifier]   # = RN testID
   po [parentViewDescriptor.view superview]
   po [[parentViewDescriptor.view superview] accessibilityIdentifier]
   po [parentViewDescriptor.view subviews]
   ```
4. Climb the superview chain until you hit a `accessibilityIdentifier` (= RN `testID`) you recognise in source. Grep for it:
   ```bash
   grep -rn 'testID="<identifier>"' apps/ledger-live-mobile/src libs/ui
   ```
   That's the RN component family. From there, read the JSX and find the conditional render / animation / library that produced the mismatch.

### 4. Map the native cause to a code pattern

The vast majority of Fabric assertions come from a small set of patterns. See reference.md "Common Fabric crash patterns".

### 5. Fix and verify Metro actually serves the fix

A common trap: Metro's file watcher dies on `EMFILE: too many open files`. Edits silently never reach the bundle. Always confirm Metro logged a fresh `Compiled ios in Xs` line after each edit (in the terminal running `pnpm mobile start:ios`, or wherever Metro's stdout is streaming).

If the watcher is broken, restart Metro with `--reset-cache`. Reload the app (Cmd+R in sim or shake → Reload).

## Guardrails

- Don't guess at causes from the JS code alone — the native debugger is the source of truth.
- Don't trust "the bug only happens when flag X is on" until the user has tested both states. Correlation in mobile apps is often coincidental (cold start vs hot reload, cache state, etc.).
- Don't apply five fixes at once. Apply one, verify Metro served it, retest. Each silent failed iteration is wasted hours.

## Output

- The exact React component identified as the orphan (from `accessibilityIdentifier` / `testID`)
- The pattern name (e.g. "Reanimated `withRepeat` on unmount", "unstable `keyExtractor`")
- The minimal fix applied
- Confirmation Metro served the fix and the crash no longer reproduces

## Reference

See `reference.md` in this folder for:
- Anatomy of a Fabric assertion message
- lldb cheatsheet for Fabric mount errors
- Catalogue of common Fabric crash patterns with code-side fixes
