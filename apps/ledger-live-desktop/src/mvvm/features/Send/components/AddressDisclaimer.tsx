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
      <TooltipContent>
        <div className="max-w-256 text-center">
          <div className="font-semibold">{t("newSendFlow.addressDisclaimer.title")}</div>
          <div>{t("newSendFlow.addressDisclaimer.description")}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export const AddressDisclaimer = React.memo(AddressDisclaimerComponent);
