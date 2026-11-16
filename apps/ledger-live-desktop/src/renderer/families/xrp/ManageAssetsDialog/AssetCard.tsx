import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardFooter,
  CardHeader,
  CardLeading,
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
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { useGetIssuerFeeQuery } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import {
  formatIssuerFee,
  formatTrustLimit,
  getRemoveAvailability,
  getXrpResources,
} from "../utils";

type Props = Readonly<{
  account: Account;
  tokenAccount: TokenAccount;
  onEdit: (tokenAccount: TokenAccount) => void;
  onDelete: (tokenAccount: TokenAccount) => void;
}>;

function Row({ label, value }: Readonly<{ label: React.ReactNode; value: React.ReactNode }>) {
  return (
    <DescriptionItem size="md">
      <DescriptionItemLeading>
        <DescriptionItemLabel>{label}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue>{value}</DescriptionItemValue>
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
}

function LabelWithInfo({ label, info }: Readonly<{ label: string; info: string }>) {
  return (
    <span className="flex items-center gap-4">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="inline-flex cursor-help border-0 bg-transparent p-0"
          >
            <Information size={12} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{info}</TooltipContent>
      </Tooltip>
    </span>
  );
}

export function AssetCard({ account, tokenAccount, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const { token } = tokenAccount;
  const issuerFee = useGetIssuerFeeQuery(token);
  const xrpResources = getXrpResources(tokenAccount);
  const removeAvailability = getRemoveAvailability(tokenAccount, account, t);
  const isIou = token.tokenType === "iou";
  const shortIssuer = formatAddress(token.contractAddress);
  const unit = token.units[0];
  const limit = xrpResources?.limit;

  const deleteButton = (
    <Button
      appearance="base"
      size="md"
      isFull
      disabled={removeAvailability.disabled}
      onClick={() => onDelete(tokenAccount)}
      data-testid="xrp-manage-assets-delete"
    >
      {t("xrp.manageAssets.delete")}
    </Button>
  );

  return (
    <Card type="info" data-testid={`xrp-manage-assets-card-${token.id}`}>
      <CardHeader>
        <CardLeading>
          <CryptoIcon
            ledgerId={token.id}
            ticker={token.ticker}
            network={token.parentCurrencyId}
            size={48}
          />
          <CardContent>
            <CardContentTitle>{token.name}</CardContentTitle>
            <CardContentDescription>{shortIssuer}</CardContentDescription>
          </CardContent>
        </CardLeading>
      </CardHeader>
      <CardFooter>
        <Row
          label={
            <LabelWithInfo
              label={t("xrp.manageAssets.tokenType")}
              info={t("xrp.manageAssets.tokenTypeTooltip")}
            />
          }
          value={isIou ? t("xrp.manageAssets.iou") : t("xrp.manageAssets.mpt")}
        />
        <Row label={t("xrp.manageAssets.issuer")} value={shortIssuer} />
        {issuerFee.isLoading ? null : (
          <Row
            label={
              <LabelWithInfo
                label={t("xrp.manageAssets.transferFee")}
                info={t("xrp.addToken.steps.review.issuerFeeTooltip")}
              />
            }
            value={
              typeof issuerFee.data === "string"
                ? formatIssuerFee(issuerFee.data, locale)
                : t("xrp.addToken.steps.review.issuerFeeUnavailable")
            }
          />
        )}
        {isIou && limit ? (
          <Row
            label={t("xrp.manageAssets.balanceLimit")}
            value={formatTrustLimit({
              limit,
              unit,
              locale,
              maximumLabel: t("xrp.addToken.steps.settings.maximum"),
            })}
          />
        ) : null}
        {isIou ? (
          <Row
            label={
              <LabelWithInfo
                label={t("xrp.manageAssets.rippling")}
                info={t("xrp.manageAssets.ripplingTooltip")}
              />
            }
            value={
              xrpResources?.isRippling
                ? t("xrp.manageAssets.activated")
                : t("xrp.manageAssets.deactivated")
            }
          />
        ) : null}
        <div className="flex w-full gap-10 pt-2">
          {isIou ? (
            <Button
              appearance="gray"
              size="md"
              isFull
              onClick={() => onEdit(tokenAccount)}
              data-testid="xrp-manage-assets-edit"
            >
              {t("xrp.manageAssets.edit")}
            </Button>
          ) : null}
          {removeAvailability.tooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex flex-1">{deleteButton}</span>
              </TooltipTrigger>
              <TooltipContent>{removeAvailability.tooltip}</TooltipContent>
            </Tooltip>
          ) : (
            deleteButton
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
