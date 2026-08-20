import { deleteContact as deleteContactAction, selectContactById } from "@domain/entity-contact";
import {
  ContactError,
  deleteContact as deleteContactAction,
  parseContactName,
  renameContact as renameContactAction,
  selectContactById,
} from "@domain/entity-contact";
import type { ContactDeviceIntentsPort } from "@features/platform-contacts";
import type { ContactDetailActionsDataPorts } from "./model/ports";

type ContactDetailActionsPortsDeps = Readonly<{
  dispatch: (action: { type: string }) => void;
  getState: () => Parameters<typeof selectContactById>[0];
  deviceIntents: ContactDeviceIntentsPort;
}>;

export function createContactDetailActionsPorts({
  dispatch,
  getState,
  deviceIntents,
}: ContactDetailActionsPortsDeps): ContactDetailActionsDataPorts {
  return {
    edit: createContactEditPort({ dispatch, getState, deviceIntents }),
    deletion: {
      deleteContact: async contactIdToDelete => {
        dispatch(deleteContactAction(contactIdToDelete));
      },
    },
  };
}
