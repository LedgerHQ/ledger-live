import type { ComponentType } from "react";
import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import type {
  ApplyUpdatesState,
  CreateBackupState,
  OsUpdatesSteps,
  PreChecksState,
  RestoreBackupState,
} from "@ledgerhq/live-dmk-shared";

export type PlatformComponentProps<Step extends OsUpdatesSteps, State> = {
  step: Step;
  state: State;
  connectedDevice: ConnectedDevice;
  onUserClose: () => void;
  isCloseConfirmationOpen: boolean;
};

export type CloseConfirmationComponentProps = {
  isOpen: boolean;
  onContinue: () => void;
  onCancel: () => void;
};

export type PreChecksComponent = ComponentType<
  PlatformComponentProps<OsUpdatesSteps.PRE_CHECKS, PreChecksState>
>;
export type CreateBackupComponent = ComponentType<
  PlatformComponentProps<OsUpdatesSteps.CREATE_BACKUP, CreateBackupState>
>;
export type ApplyUpdatesComponent = ComponentType<
  PlatformComponentProps<OsUpdatesSteps.APPLY_UPDATES, ApplyUpdatesState>
>;
export type RestoreBackupComponent = ComponentType<
  PlatformComponentProps<OsUpdatesSteps.RESTORE_BACKUP, RestoreBackupState>
>;

export type CloseConfirmationComponent = ComponentType<CloseConfirmationComponentProps>;

export type OsUpdatePlatformComponents = {
  PreChecksComponent: PreChecksComponent;
  CreateBackupComponent: CreateBackupComponent;
  ApplyUpdatesComponent: ApplyUpdatesComponent;
  RestoreBackupComponent: RestoreBackupComponent;
  CloseConfirmationComponent: CloseConfirmationComponent;
};
