---
"live-mobile": patch
---

Fix interaction between "InstalledAppsModal" and "UninstallDependenciesModal", the later one was not getting opened in case an app with dependents was getting uninstalled from the first one, due to a bad usage of drawers (not using QueuedDrawer).
Refactor prop drilling nightmare of setAppInstallWithDependencies/setAppUninstallWithDependencies with a simple React.Context.
Refactor InstalledAppDependenciesModal and UninstallAppDependenciesModal to have no business logic inside
Rename action creator installAppFirstTime to setHasInstalledAnyApp for more clarity
