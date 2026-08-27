import { useAddContactDialogAdapter } from "LLD/features/Contacts/screens/Contacts/useAddContactDialogAdapter";
import { DEFAULT_ADD_NEW_CONTACT_HEADER_STATE } from "LLD/features/Send/context/AddNewContactHeaderContext";
import {
  useSendPrefillAddAddressFlow,
  type SendPrefillAddAddressPhase,
} from "LLD/features/Send/hooks/useSendPrefillAddAddressFlow";

export type AddNewContactAddressPhase = SendPrefillAddAddressPhase;

export type AddNewContactViewModel = ReturnType<typeof useAddContactDialogAdapter> &
  Readonly<{
    addressPhase: AddNewContactAddressPhase | null;
    isOpeningAddressFlow: boolean;
  }>;

export function useAddNewContactViewModel(): AddNewContactViewModel {
  const { addressPhase, isOpeningAddressFlow, startForContact } = useSendPrefillAddAddressFlow({
    idleHeaderState: DEFAULT_ADD_NEW_CONTACT_HEADER_STATE,
  });
  const contactAdapter = useAddContactDialogAdapter(startForContact);

  return {
    ...contactAdapter,
    addressPhase,
    isOpeningAddressFlow,
  };
}
