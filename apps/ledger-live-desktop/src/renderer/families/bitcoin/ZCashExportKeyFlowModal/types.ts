import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import { AccountLike } from "@ledgerhq/types-live";
import { OpenModal } from "~/renderer/actions/modals";

export type StepId = "birthday" | "ufvk" | "device" | "confirmation";

export type StepProps = {
  t: TFunction;
  stepId: StepId;
  device: Device | undefined | null;
  account: AccountLike | undefined | null;
  error: Error | undefined;
  transitionTo: (a: string) => void;
  openModal: OpenModal;
  closeModal: () => void;
  onRetry: () => void;
  onClose: () => void;
  ufvk: string;
  ufvkExportError: Error | undefined | null;
  onStepIdChanged: (stepId: StepId) => void;
  onUfvkChanged: (ufvk: string, error?: Error | null) => void;
  birthday: string;
  invalidBirthday: boolean;
  syncFromZero: boolean;
  handleBirthdayChange: (value: string) => void;
  handleSyncFromZero: () => void;
};

export type StepperProps = Step<StepId, StepProps>;
