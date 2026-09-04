import { useCallback } from "react";
import { AssetCategory } from "@domain/api-aggregated-assets";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { ContactAddressPickerProps } from "@features/flow-pay-contact";
import { useContactAddressPicker } from "LLM/features/Contacts/hooks/useContactAddressPicker";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";

export type UsePayTabNewPayment = Readonly<{
  open: (contact?: Contact) => void;
  contactAddressPicker: ContactAddressPickerProps;
}>;

export function usePayTabNewPayment(): UsePayTabNewPayment {
  const { handleOpenSendFlow } = useOpenSendFlow({
    sourceScreenName: "Pay",
  });

  const payFromAddress = useCallback(
    (address: ContactAddress) => {
      handleOpenSendFlow({
        currencyIds: [address.currencyId],
        recipient: address.address,
        skipRecipientStep: true,
      });
    },
    [handleOpenSendFlow],
  );
  const { open: openPicker, contactAddressPicker } = useContactAddressPicker({
    onSelectAddress: payFromAddress,
  });

  const open = useCallback(
    (nextContact?: Contact) => {
      if (!nextContact) {
        handleOpenSendFlow({ categories: [AssetCategory.Stablecoins] });
        return;
      }

      openPicker(nextContact);
    },
    [handleOpenSendFlow, openPicker],
  );

  return { open, contactAddressPicker };
}
