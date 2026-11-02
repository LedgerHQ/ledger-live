import React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import {
  getEstimatedSigningTime,
  getSigningRecordCount,
} from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoFamily } from "./types";
import { getAleoCurrencyConfig } from "./shared/utils";

const SendAmountFooterRow: NonNullable<AleoFamily["SendAmountFooterRow"]> = ({
  account,
  transaction,
}) => {
  const { t } = useTranslation();
  const isAutoPickingStrategy =
    getAleoCurrencyConfig(account.currency)?.recordPickingStrategy === "auto";
  const recordCount = getSigningRecordCount(transaction);
  if (!isAutoPickingStrategy || recordCount === 0) return null;

  const signingTime = getEstimatedSigningTime(
    recordCount,
    t("time.second_short"),
    t("time.minute_short"),
  );

  return (
    <DescriptionItem
      size="sm"
      data-testid="aleo-send-estimated-time-row"
      className="items-center pb-16"
    >
      <DescriptionItemLeading>
        <DescriptionItemLabel>{t("aleo.send.amount.signingTime.label")}</DescriptionItemLabel>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("aleo.send.amount.signingTime.label")}
              className="inline-flex border-0 bg-transparent p-0 text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              data-testid="aleo-send-estimated-time-info"
            >
              <Information size={16} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("aleo.send.amount.signingTime.description")}</p>
          </TooltipContent>
        </Tooltip>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue data-testid="aleo-send-estimated-time-value">
          {signingTime}
        </DescriptionItemValue>
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
};

export default SendAmountFooterRow;
