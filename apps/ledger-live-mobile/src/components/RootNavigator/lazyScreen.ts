import type { ComponentType } from "react";
import { isGetComponentEnabled } from "LLM/utils/perfOptimizationMode";

// oxlint-disable-next-line typescript/no-explicit-any
type AnyComponent = ComponentType<any>;

type ModuleWithDefault<T extends AnyComponent> = { default: T };

export function lazyScreen<T extends AnyComponent>(load: () => ModuleWithDefault<T>): () => T {
  if (!isGetComponentEnabled()) {
    const loaded = load();
    return () => loaded.default;
  }
  return () => load().default;
}

export function lazyNamed<T extends AnyComponent>(load: () => T): () => T {
  if (!isGetComponentEnabled()) {
    const loaded = load();
    return () => loaded;
  }
  return load;
}

export function preloadBaseNavigator(): void {
  void (require("./BaseNavigator") as typeof import("./BaseNavigator"));
}

export function preloadRootNavigator(): void {
  void (require("./index") as typeof import("./index"));
}

export function preloadSettingsNavigator(): void {
  void (require("./SettingsNavigator") as typeof import("./SettingsNavigator"));
  void (require("~/screens/Settings") as typeof import("~/screens/Settings"));
}

export function preloadDeferredNavigators(): void {
  if (isGetComponentEnabled()) {
    return;
  }
  void (require("./SettingsNavigator") as typeof import("./SettingsNavigator"));
  void (require("./AccountsNavigator") as typeof import("./AccountsNavigator"));
  void (require("./SendFundsNavigator") as typeof import("./SendFundsNavigator"));
  void (require("./SwapNavigator") as typeof import("./SwapNavigator"));
  void (require("./DiscoverNavigator") as typeof import("./DiscoverNavigator"));
  void (require("./MyLedgerNavigator") as typeof import("./MyLedgerNavigator"));
  void (require("~/screens/Settings") as typeof import("~/screens/Settings"));
  void (require("~/screens/Accounts") as typeof import("~/screens/Accounts"));
  void (require("~/screens/Account") as typeof import("~/screens/Account"));
  void (require("~/screens/Assets") as typeof import("~/screens/Assets"));
}

export function scheduleIdleLoads(
  loaders: Array<() => void>,
  schedule: (cb: () => void) => void = cb => {
    setTimeout(cb, 0);
  },
): void {
  let index = 0;
  const loadNext = () => {
    const load = loaders[index];
    if (!load) return;
    index += 1;
    load();
    schedule(loadNext);
  };
  schedule(loadNext);
}

export function scheduleNamedPreloads(
  names: string[],
  preload: (name: string) => void,
  startMs = 250,
  gapMs = 400,
): ReturnType<typeof setTimeout>[] {
  return names.map((name, index) => setTimeout(() => preload(name), startMs + index * gapMs));
}

export function preloadIdleTabNavigators(): void {
  if (!isGetComponentEnabled()) {
    return;
  }
  if (typeof process !== "undefined" && process.env.JEST_WORKER_ID) {
    return;
  }
  scheduleIdleLoads(
    [
      () => void (require("./SettingsNavigator") as typeof import("./SettingsNavigator")),
      () => void (require("~/screens/Settings") as typeof import("~/screens/Settings")),
      () => void (require("./AccountsNavigator") as typeof import("./AccountsNavigator")),
      () => void (require("~/screens/Accounts") as typeof import("~/screens/Accounts")),
      () => void (require("~/screens/Account") as typeof import("~/screens/Account")),
      () => void (require("./SendFundsNavigator") as typeof import("./SendFundsNavigator")),
      () => void (require("./DiscoverNavigator") as typeof import("./DiscoverNavigator")),
      () => void (require("./MyLedgerNavigator") as typeof import("./MyLedgerNavigator")),
    ],
    cb => setTimeout(cb, 80),
  );
  scheduleIdleLoads(
    [
      () => void (require("./SwapNavigator") as typeof import("./SwapNavigator")),
      () => void (require("./EarnLiveAppNavigator") as typeof import("./EarnLiveAppNavigator")),
      () => void (require("LLM/features/PayTab") as typeof import("LLM/features/PayTab")),
      () => void (require("LLM/features/Card") as typeof import("LLM/features/Card")),
    ],
    cb => setTimeout(cb, 400),
  );
}
