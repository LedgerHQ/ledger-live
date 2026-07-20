import { ContactNameSchema } from "@domain/entity-contact";
import { getContactInitial } from "../list/internals";
import type { AddContactViewModel } from "./types";

export function createAddContactViewModel(draftName: string): AddContactViewModel {
  const trimmedDraftName = draftName.trim();

  return {
    draftName,
    avatarInitial: getContactInitial(trimmedDraftName),
    isSaveEnabled: ContactNameSchema.safeParse(trimmedDraftName).success,
  };
}
