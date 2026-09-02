import { useCallback } from "react";
import { AssetCategory } from "@domain/api-aggregated-assets";
import type { Contact } from "@domain/entity-contact";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";

const PAY_PAGE = "Pay";
const PAY_CATEGORIES: AssetCategory[] = [AssetCategory.Stablecoins];

export type UsePayTabNewPayment = Readonly<{
  open: (contact?: Contact) => void;
}>;

export function usePayTabNewPayment(): UsePayTabNewPayment {
  const { handleOpenSendFlow } = useOpenSendFlow({
    sourceScreenName: PAY_PAGE,
    categories: PAY_CATEGORIES,
  });

  const open = useCallback(
    (contact?: Contact) => {
      // Prefill the recipient only when the contact has a single saved address; with zero or
      // several addresses we keep the account/network picker so the user resolves the ambiguity.
      const contactAddress = contact?.addresses.length === 1 ? contact.addresses[0] : undefined;
      if (contactAddress) {
        // Scope account selection to the contact address' currency so the picked account is on the
        // same network, then skip to the amount step where the header resolves the prefilled
        // address back to the contact and shows the "To <contact>" header.
        handleOpenSendFlow({
          currencyIds: [contactAddress.currencyId],
          recipient: contactAddress.address,
          skipRecipientStep: true,
        });
        return;
      }

      handleOpenSendFlow();
    },
    [handleOpenSendFlow],
  );

  return { open };
}
