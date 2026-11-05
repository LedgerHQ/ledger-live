# @shared/native-performance

> [!CAUTION]
> **Status: UNSTABLE** — New package; the API may grow with more performance measures.

App performance measures that need native code. React Native apps get the native module through
autolinking: the package ships a podspec (`SharedNativePerformance`) and an Android library
(`com.ledger.nativeperformance`).

## Exports

| Export                | Description                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `getProcessStartTime` | `() => number \| null` — Unix time in ms when the app process started, read once per process (sync) |

`getProcessStartTime` returns `null` when:

- the process was not started to show the app (iOS prewarm or background launch, Android process
  started for a push or a broadcast),
- the value was already read in this process (a JS-only restart, for example `RNRestart`),
- the native module is not linked (for example in tests).

A native failure is thrown to the caller.

## Native setup

The app must record the launch first thing at startup, while the launch reason is still known:

```swift
// AppDelegate.swift, first line of didFinishLaunchingWithOptions
import SharedNativePerformance

AppStartupModule.recordLaunch(application)
```

```kotlin
// MainApplication.kt, first line of onCreate
import com.ledger.nativeperformance.AppStartupModule

AppStartupModule.recordLaunch()
```

| Platform | Source of the process start time                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------- |
| iOS      | `sysctl` → `p_starttime`                                                                                 |
| Android  | `Process.getStartRequestedElapsedRealtime()` on API 33+ (USAP pre-fork), else `getStartElapsedRealtime()` |

## Usage

```ts
import { getProcessStartTime } from "@shared/native-performance";

const processStartTime = getProcessStartTime();
```

## Testing

Without the native module, `getProcessStartTime()` returns `null`. Tests that need a value should
`jest.mock("@shared/native-performance")`.
