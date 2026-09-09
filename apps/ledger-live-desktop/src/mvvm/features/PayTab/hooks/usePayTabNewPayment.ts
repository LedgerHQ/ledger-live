import { useCallback } from "react";
import { AssetCategory } from "@domain/api-aggregated-assets";
import type { Contact } from "@domain/entity-contact";
import { SEND_FLOW_SOURCE } from "@ledgerhq/live-common/flows/send/types";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";

// Card payments only spend stablecoins; filter the account picker by category so the
// user still picks any supported network without listing every currency id.
const PAY_CATEGORIES = [AssetCategory.Stablecoins] as const;

export type UsePayTabNewPayment = Readonly<{
  open: (contact?: Contact) => void;
}>;

export function usePayTabNewPayment(): UsePayTabNewPayment {
  const openSendFlow = useOpenSendFlow();

  const open = useCallback(
    (contact?: Contact) => {
      // Prefill the recipient only when the contact has a single saved address; with zero or
      // several addresses we keep the account/network picker so the user resolves the ambiguity.
      const contactAddress = contact?.addresses.length === 1 ? contact.addresses[0] : undefined;
      if (contactAddress) {
        // Scope account selection to the contact address' currency so the picked account is on the
        // same network, then skip to the amount step where the header resolves the prefilled
        // address back to the contact and shows the "To <contact>" header.
        openSendFlow({
          source: SEND_FLOW_SOURCE.PAY,
          currencyIds: [contactAddress.currencyId],
          recipient: contactAddress.address,
          skipRecipientStep: true,
        });
        return;
      }

      openSendFlow({ source: SEND_FLOW_SOURCE.PAY, categories: PAY_CATEGORIES });
    },
    [openSendFlow],
  );

  return { open };
}
