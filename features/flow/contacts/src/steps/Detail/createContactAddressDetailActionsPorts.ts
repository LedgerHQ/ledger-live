import {
  deleteAddress as deleteAddressAction,
  selectContactAddressById,
} from "@domain/entity-contact";
import {
  createContactAddressEditPort,
  type ContactDeviceIntentsPort,
} from "@features/platform-contacts";
import type { ContactAddressDetailActionsDataPorts } from "./model/ports";

type ContactAddressDetailActionsPortsDeps = Readonly<{
  dispatch: (action: { type: string }) => void;
  getState: () => Parameters<typeof selectContactAddressById>[0];
  deviceIntents: ContactDeviceIntentsPort;
}>;

export function createContactAddressDetailActionsPorts({
  dispatch,
  getState,
  deviceIntents,
}: ContactAddressDetailActionsPortsDeps): ContactAddressDetailActionsDataPorts {
  return {
    edit: createContactAddressEditPort({ dispatch, getState, deviceIntents }),
    deletion: {
      deleteAddress: async input => {
        dispatch(deleteAddressAction(input));
      },
    },
  };
}
