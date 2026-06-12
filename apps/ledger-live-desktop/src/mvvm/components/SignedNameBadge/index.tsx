import React from "react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { ShieldCheck } from "@ledgerhq/lumen-ui-react/symbols";

type SignedNameBadgeProps = Readonly<{
  "data-testid"?: string;
}>;

/**
 * 16px shield-check shown next to an account name whose name is signed
 * with the Ledger device (a `registerLedgerAccount` record exists in the
 * contacts wallet) — Figma 14414:20871. Hovering surfaces the
 * "Name signed with your Ledger" tooltip.
 *
 * Pure visual: the CALLER decides whether the name is signed (resolution
 * differs per surface — see `SignedNameShield` in CryptoAddresses for the
 * derivation-path matching variant, or `buildSendAccountSuggestions` for
 * the send flow's).
 */
export function SignedNameBadge({
  "data-testid": testId = "signed-name-badge",
}: SignedNameBadgeProps) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ShieldCheck
          size={16}
          role="img"
          tabIndex={0}
          aria-label={t("cryptoAddresses.table.nameSignedTooltip")}
          className="shrink-0 text-muted cursor-default focus:outline-none"
          data-testid={testId}
        />
      </TooltipTrigger>
      <TooltipContent side="top">{t("cryptoAddresses.table.nameSignedTooltip")}</TooltipContent>
    </Tooltip>
  );
}
