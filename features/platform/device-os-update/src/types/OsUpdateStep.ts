import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import type { ApplyUpdatesState } from "./ApplyUpdatesState";
import type { CreateBackupState } from "./CreateBackupState";
import type { OsUpdatesSteps } from "./OsUpdatesSteps";
import type { PreChecksState } from "./PreChecksState";
import type { RestoreBackupState } from "./RestoreBackupState";

export type OsUpdateStepProps =
  | OsUpdateStepPropsOf<OsUpdatesSteps.PRE_CHECKS, PreChecksState>
  | OsUpdateStepPropsOf<OsUpdatesSteps.CREATE_BACKUP, CreateBackupState>
  | OsUpdateStepPropsOf<OsUpdatesSteps.APPLY_UPDATES, ApplyUpdatesState>
  | OsUpdateStepPropsOf<OsUpdatesSteps.RESTORE_BACKUP, RestoreBackupState>;

type OsUpdateStepPropsOf<Step extends OsUpdatesSteps, State> = Readonly<{
  step: Step;
  state: State;
  connectedDevice: ConnectedDevice;
  onUserClose: () => void;
  isCloseConfirmationOpen: boolean;
}>;

export type CloseConfirmationProps = Readonly<{
  isOpen: boolean;
  onContinue: () => void;
  onCancel: () => void;
}>;
