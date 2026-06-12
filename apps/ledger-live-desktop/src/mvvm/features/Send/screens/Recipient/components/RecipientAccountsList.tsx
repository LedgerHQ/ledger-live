import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { DialogBody, SearchInput } from "@ledgerhq/lumen-ui-react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  useSendAccountSuggestions,
  type SendAccountSuggestion,
} from "../../../hooks/useSendAccountSuggestions";
import { AccountSuggestionRow } from "../../../components/RecipientRows";

type Props = Readonly<{
  currency: CryptoCurrency | TokenCurrency | null;
  /** Main (sending) account id — excluded from the list. */
  currentMainAccountId: string | undefined;
  /** EVM chainId of the selected network — scopes the device-signed records. */
  chainId: number | undefined;
  onSelect: (suggestion: SendAccountSuggestion) => void;
}>;

/**
 * Full "My accounts" list for the Recipient step (Figma 14437:43129),
 * reached by clicking the "My accounts" subheader in the preview. Local
 * search input + the user's own accounts compatible with the selected
 * crypto's chain, with fiat + crypto balances trailing.
 */
export function RecipientAccountsList({
  currency,
  currentMainAccountId,
  chainId,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const accounts = useSendAccountSuggestions(search, currency, currentMainAccountId, chainId);

  return (
    <DialogBody
      // `pt-8` so the focused search input's purple ring has clearance from
      // the header — the body has no intrinsic top padding, so without this
      // the top edge of the ring reads as cropped (same fix as the
      // Add-contact dialog).
      className="flex flex-col gap-16 px-24 pt-8 pb-16"
      data-testid="send-recipient-accounts-list"
    >
      <SearchInput
        appearance="plain"
        placeholder={t("newSendFlow.picker.searchAccount")}
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
        data-testid="send-recipient-accounts-search"
      />
      <div className="flex flex-col">
        {accounts.map(s => (
          <AccountSuggestionRow key={s.id} suggestion={s} onSelect={onSelect} />
        ))}
      </div>
    </DialogBody>
  );
}
