import { useCallback } from "react";
import { AssetCategory } from "@domain/api-aggregated-assets";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import { SEND_FLOW_SOURCE } from "@ledgerhq/live-common/flows/send/types";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";

// Card payments only spend stablecoins; filter the account picker by category so the
// user still picks any supported network without listing every currency id.
const PAY_CATEGORIES = [AssetCategory.Stablecoins] as const;

export type UsePayTabNewPayment = Readonly<{
  open: (contact?: Contact) => void;
  payFromAddress: (address: ContactAddress) => void;
}>;

export function usePayTabNewPayment(): UsePayTabNewPayment {
  const openSendFlow = useOpenSendFlow();

  const payFromAddress = useCallback(
    (address: ContactAddress) => {
      openSendFlow({
        source: SEND_FLOW_SOURCE.PAY,
        currencyIds: [address.currencyId],
        recipient: address.address,
        skipRecipientStep: true,
      });
    },
    [openSendFlow],
  );

  const open = useCallback(
    (contact?: Contact) => {
      const contactAddress = contact?.addresses.length === 1 ? contact.addresses[0] : undefined;
      if (contactAddress) {
        payFromAddress(contactAddress);
        return;
      }

      openSendFlow({ source: SEND_FLOW_SOURCE.PAY, categories: PAY_CATEGORIES });
    },
    [openSendFlow, payFromAddress],
  );

  return { open, payFromAddress };
}
