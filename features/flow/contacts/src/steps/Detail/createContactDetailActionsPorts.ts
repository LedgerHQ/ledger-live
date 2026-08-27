import { deleteContact as deleteContactAction, selectContactById } from "@domain/entity-contact";
import {
  createContactEditPort,
  createMockContactDeviceIntentsPort,
  type ContactDeviceIntentsPort,
} from "@features/platform-contacts";
import type { ContactDetailActionsDataPorts } from "./model/ports";

type ContactDetailActionsPortsDeps = Readonly<{
  dispatch: (action: { type: string }) => void;
  getState: () => Parameters<typeof selectContactById>[0];
  deviceIntents?: ContactDeviceIntentsPort;
}>;

export function createContactDetailActionsPorts({
  dispatch,
  getState,
  deviceIntents = createMockContactDeviceIntentsPort(),
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
