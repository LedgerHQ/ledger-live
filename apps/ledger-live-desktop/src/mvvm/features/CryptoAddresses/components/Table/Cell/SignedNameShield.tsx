import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { ShieldCheck } from "@ledgerhq/lumen-ui-react/symbols";
import type { AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useContacts } from "~/renderer/contacts/useContacts";

type SignedNameShieldProps = {
  readonly account: AccountLike;
  readonly displayName: string;
};

/**
 * 16px `shield-check` shown next to an account's name once that name
 * has been signed with the Ledger device (Figma `14414:20871`).
 *
 * "Signed" = the device-gated rename (or the L1 register form) ran DMK
 * `registerLedgerAccount`, which commits a `LedgerAccount` record into
 * the contacts wallet's `accounts` map under the signed name. We match
 * the record back to THIS row by name + chainId + derivation path so a
 * coincidentally same-named registration on another chain/account
 * doesn't earn the shield.
 *
 * Hovering surfaces a "Name signed with your Ledger" tooltip (top).
 */
export function SignedNameShield({ account, displayName }: SignedNameShieldProps) {
  const { t } = useTranslation();
  const { wallet } = useContacts();

  if (account.type !== "Account") return null;
  const registered = wallet?.accounts?.[displayName];
  if (!registered) return null;
  const chainId = account.currency.ethereumLikeInfo?.chainId;
  const signed =
    registered.chainId === chainId && registered.derivationPath === account.freshAddressPath;
  if (!signed) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ShieldCheck
          size={16}
          role="img"
          tabIndex={0}
          aria-label={t("cryptoAddresses.table.nameSignedTooltip")}
          className="shrink-0 text-muted cursor-default focus:outline-none"
          data-testid="crypto-addresses-name-signed-shield"
        />
      </TooltipTrigger>
      <TooltipContent side="top">
        {t("cryptoAddresses.table.nameSignedTooltip")}
      </TooltipContent>
    </Tooltip>
  );
}
