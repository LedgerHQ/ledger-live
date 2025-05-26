import { Observable, Subject, of, share, takeUntil } from "rxjs";
import { catchError, tap, withLatestFrom } from "rxjs/operators";
import type {
  DeviceManagementKit,
  DeviceActionState,
  InstallPlan,
  ExecuteDeviceActionReturnType,
  DeviceSessionState,
  GetOsVersionResponse,
  FirmwareUpdateContext as DmkFirmwareUpdateContext,
} from "@ledgerhq/device-management-kit";
import {
  DeviceActionStatus,
  DeviceLockedError,
  DeviceSessionStateType,
  DeviceStatus,
  UserInteractionRequired,
  OutOfMemoryDAError,
  SecureChannelError,
  UnsupportedFirmwareDAError,
} from "@ledgerhq/device-management-kit";
import type {
  ConnectAppDAOutput,
  ConnectAppDAError,
  ConnectAppDAIntermediateValue,
} from "@ledgerhq/live-dmk-shared";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import {
  UserRefusedAllowManager,
  UserRefusedOnDevice,
  LatestFirmwareVersionRequired,
} from "@ledgerhq/errors";

import type { SkippedAppOp } from "../apps/types";
import { SkipReason } from "../apps/types";
import { parseDeviceInfo } from "../deviceSDK/tasks/getDeviceInfo";
import { ConnectAppEvent } from "./connectApp";

export class ConnectAppEventMapper {
  private openAppRequested: boolean = false;
  private permissionRequested: boolean = false;
  private lastSeenDeviceSent: boolean = false;
  private installPlan: InstallPlan | null = null;
  private eventSubject = new Subject<ConnectAppEvent>();

  constructor(
    private dmk: DeviceManagementKit,
    private sessionId: string,
    private appName: string,
    private events: ExecuteDeviceActionReturnType<
      ConnectAppDAOutput,
      ConnectAppDAError,
      ConnectAppDAIntermediateValue
    >,
  ) {}

  map(): Observable<ConnectAppEvent> {
    const cancelAction = this.events.cancel;
    const unsubscribe = new Subject<void>();

    // Create a shared observable for device session state
    const deviceSessionState = this.dmk
      .getDeviceSessionState({ sessionId: this.sessionId })
      .pipe(share());

    // Subscribe to device action events
    this.events.observable
      .pipe(
        withLatestFrom(deviceSessionState),
        tap(([event, deviceState]) => this.handleEvent(event, deviceState)),
        takeUntil(unsubscribe),
        catchError(error => this.handleError(error)),
      )
      .subscribe();

    // Subscribe to device session state events
    deviceSessionState
      .pipe(
        tap(deviceState => this.handleDeviceState(deviceState)),
        takeUntil(unsubscribe),
      )
      .subscribe();

    return new Observable<ConnectAppEvent>(observer => {
      const sub = this.eventSubject.subscribe(observer);
      return () => {
        sub.unsubscribe();
        cancelAction();
        unsubscribe.next();
      };
    });
  }

  private handleDeviceState(deviceState: DeviceSessionState): void {
    if (deviceState.sessionStateType === DeviceSessionStateType.Connected) {
      return;
    }

    if (deviceState.deviceStatus === DeviceStatus.NOT_CONNECTED) {
      this.eventSubject.next({ type: "disconnected", expected: false });
    } else if (
      deviceState.firmwareVersion?.metadata &&
      deviceState.firmwareUpdateContext &&
      !this.lastSeenDeviceSent
    ) {
      this.lastSeenDeviceSent = true;
      this.eventSubject.next({
        type: "device-update-last-seen",
        deviceInfo: this.mapDeviceInfo(deviceState.firmwareVersion.metadata),
        latestFirmware: this.mapLatestFirmware(deviceState.firmwareUpdateContext),
      });
    }
  }

  private handleEvent(
    event: DeviceActionState<ConnectAppDAOutput, ConnectAppDAError, ConnectAppDAIntermediateValue>,
    deviceState: DeviceSessionState,
  ): void {
    switch (event.status) {
      case DeviceActionStatus.Pending:
        this.handlePendingEvent(event.intermediateValue);
        break;
      case DeviceActionStatus.Completed:
        this.handleCompletedEvent(event.output, deviceState);
        break;
      case DeviceActionStatus.Error:
        this.handleErrorEvent(event.error, deviceState);
        break;
      case DeviceActionStatus.NotStarted:
      case DeviceActionStatus.Stopped:
        this.eventSubject.error(new Error("Unexpected device action status"));
        break;
    }
  }

  private handlePendingEvent(intermediateValue: ConnectAppDAIntermediateValue): void {
    switch (intermediateValue.requiredUserInteraction) {
      case UserInteractionRequired.ConfirmOpenApp:
        if (!this.openAppRequested) {
          this.openAppRequested = true;
          this.eventSubject.next({ type: "ask-open-app", appName: this.appName });
        }
        break;
      case UserInteractionRequired.AllowSecureConnection:
        if (!this.permissionRequested) {
          this.permissionRequested = true;
          this.eventSubject.next({ type: "device-permission-requested" });
        }
        break;
      case UserInteractionRequired.UnlockDevice:
        this.eventSubject.next({ type: "lockedDevice" });
        break;
      case UserInteractionRequired.None:
        if (this.openAppRequested) {
          this.openAppRequested = false;
          this.eventSubject.next({ type: "device-permission-granted" });
        }
        if (this.permissionRequested) {
          this.permissionRequested = false;
          this.eventSubject.next({ type: "device-permission-granted" });

          // Simulate apps listing (not systematic step in LDMK)
          this.eventSubject.next({ type: "listing-apps" });
        }
        if (intermediateValue.installPlan !== null) {
          this.handleInstallPlan(intermediateValue.installPlan);
        }
        break;
    }
  }

  private handleInstallPlan(installPlan: InstallPlan): void {
    // Handle install plan resolved events
    if (this.installPlan === null) {
      // Skipped applications
      const alreadyInstalled = this.mapSkippedApps(
        installPlan.alreadyInstalled,
        SkipReason.AppAlreadyInstalled,
      );
      const missing = this.mapSkippedApps(
        installPlan.missingApplications,
        SkipReason.NoSuchAppOnProvider,
      );
      const skippedAppOps = [...alreadyInstalled, ...missing];
      if (skippedAppOps.length > 0) {
        this.eventSubject.next({
          type: "some-apps-skipped",
          skippedAppOps,
        });
      }

      // Install queue content
      this.eventSubject.next({
        type: "listed-apps",
        installQueue: installPlan.installPlan.map(app => app.versionName),
      });
    }

    // Handle ongoing install events
    this.eventSubject.next({
      type: "inline-install",
      progress: installPlan.currentProgress,
      itemProgress: installPlan.currentIndex,
      currentAppOp: {
        type: "install",
        name: installPlan.installPlan[installPlan.currentIndex]!.versionName,
      },
      installQueue: installPlan.installPlan.map(app => app.versionName),
    });
    this.installPlan = installPlan;
  }

  private handleCompletedEvent(output: ConnectAppDAOutput, deviceState: DeviceSessionState): void {
    if (deviceState.sessionStateType !== DeviceSessionStateType.Connected) {
      // Handle opened app
      const currentApp = deviceState.currentApp;
      let flags: number | Buffer = 0;
      if (typeof currentApp.flags === "number") {
        flags = currentApp.flags;
      } else if (currentApp.flags !== undefined) {
        flags = Buffer.from(currentApp.flags);
      }
      this.eventSubject.next({
        type: "opened",
        app: {
          name: currentApp.name,
          version: currentApp.version,
          flags,
        },
        derivation: output.derivation ? { address: output.derivation } : undefined,
      });
    }
    this.eventSubject.complete();
  }

  private handleErrorEvent(error: ConnectAppDAError, deviceState: DeviceSessionState): void {
    if (error instanceof OutOfMemoryDAError && this.installPlan !== null) {
      const appNames = this.installPlan.installPlan.map(app => app.versionName);
      this.eventSubject.next({
        type: "app-not-installed",
        appNames,
        appName: appNames[0]!,
      });
      this.eventSubject.complete();
    } else if (
      error instanceof UnsupportedFirmwareDAError &&
      deviceState.sessionStateType !== DeviceSessionStateType.Connected
    ) {
      this.eventSubject.error(
        new LatestFirmwareVersionRequired("LatestFirmwareVersionRequired", {
          current: deviceState.firmwareUpdateContext!.currentFirmware.version,
          latest:
            deviceState.firmwareUpdateContext?.availableUpdate?.finalFirmware.version ||
            deviceState.firmwareUpdateContext!.currentFirmware.version,
        }),
      );
    } else if (error instanceof DeviceLockedError) {
      this.eventSubject.next({ type: "lockedDevice" });
      this.eventSubject.complete();
    } else if (error instanceof SecureChannelError) {
      this.eventSubject.error(new UserRefusedAllowManager());
    } else if ("_tag" in error && error._tag === "WebHidSendReportError") {
      this.eventSubject.next({ type: "disconnected", expected: false });
      this.eventSubject.complete();
    } else if ("errorCode" in error && typeof error.errorCode === "string" && "_tag" in error) {
      this.eventSubject.error(this.mapDeviceError(error.errorCode, error._tag));
    } else {
      this.eventSubject.error(error);
    }
  }

  private handleError(error: Error): Observable<never> {
    this.eventSubject.error(error);
    return of();
  }

  private mapDeviceError(errorCode: string, defaultMessage: string): Error {
    switch (errorCode) {
      case "5501":
        return new UserRefusedOnDevice();
      default:
        return new Error(defaultMessage);
    }
  }

  private mapSkippedApps(appNames: string[], reason: SkipReason): SkippedAppOp[] {
    return appNames.map(name => ({
      reason,
      appOp: {
        type: "install",
        name,
      },
    }));
  }

  private mapDeviceInfo(osVersion: GetOsVersionResponse): DeviceInfo {
    return parseDeviceInfo({
      isBootloader: osVersion.isBootloader,
      rawVersion: osVersion.seVersion, // Always the SE version since at this step we cannot be in bootloader mode
      targetId: osVersion.targetId,
      seVersion: osVersion.seVersion,
      seTargetId: osVersion.seTargetId,
      mcuBlVersion: undefined, // We cannot be in bootloader mode at this step
      mcuVersion: osVersion.mcuSephVersion,
      mcuTargetId: osVersion.mcuTargetId,
      flags: Buffer.from(osVersion.seFlags),
      bootloaderVersion: osVersion.mcuBootloaderVersion,
      hardwareVersion: parseInt(osVersion.hwVersion, 16),
      languageId: osVersion.langId,
    });
  }

  private mapLatestFirmware(updateContext: DmkFirmwareUpdateContext): FirmwareUpdateContext | null {
    if (!updateContext.availableUpdate) {
      return null;
    }
    const availableUpdate = updateContext.availableUpdate;
    const osu = availableUpdate.osuFirmware;
    const final = availableUpdate.finalFirmware;
    return {
      osu: {
        id: osu.id,
        perso: osu.perso,
        firmware: osu.firmware,
        firmware_key: osu.firmwareKey,
        hash: osu.hash || "",
        next_se_firmware_final_version: osu.nextFinalFirmware,
        // Following fields are inherited from dto, but unused
        description: undefined,
        display_name: undefined,
        notes: undefined,
        name: "",
        date_creation: "",
        date_last_modified: "",
        device_versions: [],
        providers: [],
        previous_se_firmware_final_version: [],
      },
      final: {
        id: final.id,
        name: final.version,
        version: final.version,
        perso: final.perso,
        firmware: final.firmware || "",
        firmware_key: final.firmwareKey || "",
        hash: final.hash || "",
        bytes: final.bytes || 0,
        mcu_versions: final.mcuVersions,
        // Following fields are inherited from dto, but unused
        description: undefined,
        display_name: undefined,
        notes: undefined,
        se_firmware: 0,
        date_creation: "",
        date_last_modified: "",
        device_versions: [],
        application_versions: [],
        osu_versions: [],
        providers: [],
      },
      shouldFlashMCU: availableUpdate.mcuUpdateRequired,
    };
  }
}
