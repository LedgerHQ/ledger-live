import type { ContactNameValidationErrorName } from "@domain/entity-contact";

export type AddContactViewModel = Readonly<{
  draftName: string;
  avatarInitial: string;
  invalidNameError: ContactNameValidationErrorName | null;
  isSaveEnabled: boolean;
}>;
