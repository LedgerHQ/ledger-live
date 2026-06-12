import React from "react";
import { useTranslation } from "react-i18next";
import {
  Subheader,
  SubheaderCount,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  useRecipientSuggestions,
  type RecipientSuggestion,
} from "../hooks/useRecipientSuggestions";
import {
  useSendAccountSuggestions,
  type SendAccountSuggestion,
} from "../hooks/useSendAccountSuggestions";
import { AccountSuggestionRow, ContactSuggestionRow } from "./RecipientRows";

/** Preview cap per section (Figma 14437:40339) — the full lists live behind the subheaders. */
const MAX_PREVIEW_ROWS = 2;

type Props = {
  query: string;
  chainId: number | undefined;
  currency: CryptoCurrency | TokenCurrency | null;
  /** Main (sending) account id — excluded from "My accounts". */
  currentMainAccountId: string | undefined;
  onSelect: (suggestion: RecipientSuggestion) => void;
  onSelectAccount: (suggestion: SendAccountSuggestion) => void;
  /** Open the full alphabetical contact list (Figma 14437:40767). */
  onShowAllContacts: () => void;
  /** Open the full compatible-accounts list (Figma 14437:43129). */
  onShowAllAccounts: () => void;
};

/**
 * Contacts / My accounts previews under the Recipient address input
 * (Figma 14437:40339, filtered state 14437:43566).
 *
 * Each section shows at most {@link MAX_PREVIEW_ROWS} rows; the subheader
 * carries the FULL match count and is clickable (count + chevron) to open
 * the corresponding full-list view.
 *
 * Both sections only ever contain entries compatible with the selected
 * crypto + network: contacts are chain-filtered by `chainId` (EVM), and
 * accounts are the user's own accounts on the selected currency's chain.
 * When the query is a fully-formed address that matches a stored entry,
 * the contacts group folds (see `buildRecipientSuggestionGroups`) and the
 * matched row renders in the dialog body instead.
 */
export const RecipientPicker = ({
  query,
  chainId,
  currency,
  currentMainAccountId,
  onSelect,
  onSelectAccount,
  onShowAllContacts,
  onShowAllAccounts,
}: Props) => {
  const { t } = useTranslation();
  // Contacts must hold the SELECTED asset, not just any address on the
  // chain — a QNT entry must not show while sending ETH.
  const { external } = useRecipientSuggestions(query, chainId, currency?.ticker);
  const accounts = useSendAccountSuggestions(query, currency, currentMainAccountId, chainId);

  if (external.length === 0 && accounts.length === 0) return null;

  return (
    <div className="mb-12 flex flex-col gap-8 px-24" data-testid="send-recipient-picker">
      {external.length > 0 && (
        <section className="flex flex-col">
          <Subheader>
            <SubheaderRow
              onClick={onShowAllContacts}
              data-testid="send-recipient-picker-contacts-header"
            >
              <SubheaderTitle className="heading-5-semi-bold">
                {t("newSendFlow.picker.contacts")}
              </SubheaderTitle>
              <SubheaderCount value={external.length} />
              <SubheaderShowMore />
            </SubheaderRow>
          </Subheader>
          {external.slice(0, MAX_PREVIEW_ROWS).map(s => (
            <ContactSuggestionRow key={s.id} suggestion={s} onSelect={onSelect} />
          ))}
        </section>
      )}
      {accounts.length > 0 && (
        <section className="flex flex-col">
          <Subheader>
            <SubheaderRow
              onClick={onShowAllAccounts}
              data-testid="send-recipient-picker-accounts-header"
            >
              <SubheaderTitle className="heading-5-semi-bold">
                {t("newSendFlow.picker.myAccounts")}
              </SubheaderTitle>
              <SubheaderCount value={accounts.length} />
              <SubheaderShowMore />
            </SubheaderRow>
          </Subheader>
          {accounts.slice(0, MAX_PREVIEW_ROWS).map(s => (
            <AccountSuggestionRow key={s.id} suggestion={s} onSelect={onSelectAccount} />
          ))}
        </section>
      )}
    </div>
  );
};
