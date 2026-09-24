import { useCallback } from "react";
import { AssetCategory } from "@domain/api-aggregated-assets";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { ContactAddressPickerProps } from "@features/flow-pay-contact";
import { SEND_FLOW_SOURCE } from "@ledgerhq/live-common/flows/send/types";
import { useContactAddressPicker } from "LLM/features/Contacts/hooks/useContactAddressPicker";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";

// Card payments only spend stablecoins; filter the account picker by category so the
// user still picks any supported network without listing every currency id.
const PAY_CATEGORIES = [AssetCategory.Stablecoins];

export type UsePayTabNewPayment = Readonly<{
  open: (contact?: Contact) => void;
  contactAddressPicker: ContactAddressPickerProps;
}>;

export function usePayTabNewPayment(): UsePayTabNewPayment {
  const { handleOpenSendFlow } = useOpenSendFlow({
    sourceScreenName: SEND_FLOW_SOURCE.PAY,
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
        handleOpenSendFlow({ categories: PAY_CATEGORIES });
        return;
      }

      openPicker(nextContact);
    },
    [handleOpenSendFlow, openPicker],
  );

  return { open, contactAddressPicker };
}
