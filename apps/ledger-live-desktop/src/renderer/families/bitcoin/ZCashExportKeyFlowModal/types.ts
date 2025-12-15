import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import { AccountLike } from "@ledgerhq/types-live";
import { OpenModal } from "~/renderer/actions/modals";

export type StepId = "intro" | "device" | "export" | "confirmation";

export type StepProps = {
  t: TFunction;
  device: Device | undefined | null;
  account: AccountLike | undefined | null;
  isUfvkExported: boolean;
  ufvkExportError: Error | undefined | null;
  error: Error | undefined;
  transitionTo: (a: string) => void;
  onRetry: () => void;
  openModal: OpenModal;
  closeModal: () => void;
  onUfvkExported: (b?: boolean | null, e?: Error | null) => void;
};

export type St = Step<StepId, StepProps>;
