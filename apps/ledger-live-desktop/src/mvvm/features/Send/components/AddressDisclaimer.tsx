import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";

/**
 * Info icon shown next to the read-only recipient address, reminding the user to
 * verify the full address on their Ledger device.
 */
function AddressDisclaimerComponent() {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Information
          size={20}
          className="text-muted"
          data-testid="send-address-disclaimer-icon"
          aria-label={t("newSendFlow.addressDisclaimer.accessibilityLabel")}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="max-w-256">{t("newSendFlow.addressDisclaimer.description")}</div>
      </TooltipContent>
    </Tooltip>
  );
}

export const AddressDisclaimer = React.memo(AddressDisclaimerComponent);
