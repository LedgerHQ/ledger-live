import { deleteAddress as deleteAddressAction } from "@domain/entity-contact";
import type { ContactAddressDeletionPort } from "./model/ports";

type CreateContactAddressDeletePortDeps = Readonly<{
  dispatch: (action: { type: string }) => void;
}>;

export function createContactAddressDeletePort({
  dispatch,
}: CreateContactAddressDeletePortDeps): ContactAddressDeletionPort {
  return {
    deleteAddress: async input => {
      dispatch(deleteAddressAction(input));
    },
  };
}
