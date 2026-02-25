/**
 * E2E override for ConnectAppDeviceAction.
 * Used only in testing builds via the `build:test` script,
 * which copies this compiled output over the production ConnectAppDeviceAction.js.
 *
 * Patches:
 * - isAppOpened guard: always returns true (Speculos already has the app running)
 * - shouldCheckDependencies guard: always returns false (skip dependency/metadata flow,
 *   go straight to GetDeviceStatus → Success)
 */
import { ConnectAppDeviceAction as OriginalConnectAppDeviceAction } from "./ConnectAppDeviceAction";
import type { InternalApi } from "@ledgerhq/device-management-kit";

export class ConnectAppDeviceAction extends OriginalConnectAppDeviceAction {
  makeStateMachine(internalApi: InternalApi) {
    const machine = super.makeStateMachine(internalApi);
    if (process.env.E2E_SKIP_DMK_CONNECT_APP_CHECKS !== "1") {
      return machine;
    }
    console.log(
      "[ConnectAppDA:E2E] Using e2e override — isAppOpened=true, shouldCheckDependencies=false",
    );
    return machine.provide({
      guards: {
        isAppOpened: () => {
          console.log("[ConnectAppDA:E2E] isAppOpened guard bypassed → true");
          return true;
        },
        shouldCheckDependencies: () => {
          console.log("[ConnectAppDA:E2E] shouldCheckDependencies guard bypassed → false");
          return false;
        },
      },
    });
  }
}
