import React from "react";
import BigNumber from "bignumber.js";
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
  Skeleton,
  Tag,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import {
  useGetIssuerFeeQuery,
  useGetNetworkReservesQuery,
} from "@ledgerhq/live-common/families/xrp/state-manager/api";
import { formatIssuerFee, formatTrustLimit } from "@ledgerhq/live-common/families/xrp/tokens";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import { localeSelector } from "~/renderer/reducers/settings";
import { LabelWithInfo } from "../components/LabelWithInfo";
import { XrpAmount } from "../components/XrpAmount";
import { getRemoveAvailability, isFrozenToken } from "../utils";

type Props = Readonly<{
  account: Account;
  tokenAccount: XrpTokenAccount;
}>;

type AssetCardProps = Props &
  Readonly<{
    onEdit: (tokenAccount: XrpTokenAccount) => void;
    onDelete: (tokenAccount: XrpTokenAccount) => void;
  }>;

function Row({ label, value }: Readonly<{ label: React.ReactNode; value: React.ReactNode }>) {
  return (
    <DescriptionItem size="sm" className="h-[20px] justify-center items-center">
      <DescriptionItemLeading>
        <DescriptionItemLabel>{label}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue>{value}</DescriptionItemValue>
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
}

function TransferFee({ token }: Readonly<{ token: TokenCurrency }>) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const issuerFee = useGetIssuerFeeQuery(token);

  if (issuerFee.isError) {
    return t("xrp.manageAssets.transferFeeUnavailable");
  }

  if (typeof issuerFee.data === "string") {
    return formatIssuerFee(issuerFee.data, locale);
  }

  return (
    <Skeleton
      className="h-16 w-80 rounded-full"
      data-testid="xrp-manage-assets-transfer-fee-loading"
      aria-hidden
    />
  );
}

function LockedAmount({ currency }: Readonly<{ currency: CryptoCurrency }>) {
  const { t } = useTranslation();
  const reserves = useGetNetworkReservesQuery(currency.id);

  if (reserves.isError) {
    return t("xrp.manageAssets.lockedAmountUnavailable");
  }

  if (reserves.data) {
    return (
      <XrpAmount currency={currency} value={new BigNumber(reserves.data.increment)} size="sm" />
    );
  }

  return (
    <Skeleton
      className="h-16 w-80 rounded-full"
      data-testid="xrp-manage-assets-locked-amount-loading"
      aria-hidden
    />
  );
}

export function AssetCard({ account, tokenAccount, onEdit, onDelete }: AssetCardProps) {
  const { t } = useTranslation();
  const removeAvailability = getRemoveAvailability(tokenAccount, account, t);
  const locale = useSelector(localeSelector);
  const discreet = useDiscreetMode();
  const { token, xrpResources } = tokenAccount;
  const isIou = token.tokenType === "iou";
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
            network={account.currency.isTestnetFor ?? account.currency.id}
            size={48}
          />
          <CardContent>
            <div className="flex items-center gap-8">
              <CardContentTitle>{token.name}</CardContentTitle>
              {isFrozenToken(tokenAccount, account) ? (
                <Tag
                  appearance="gray"
                  size="sm"
                  label={t("xrp.manageAssets.frozen")}
                  data-testid="xrp-manage-assets-frozen-tag"
                />
              ) : null}
            </div>
            <CardContentDescription>{formatAddress(account.freshAddress)}</CardContentDescription>
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
        <Row
          label={
            <LabelWithInfo
              label={t("xrp.manageAssets.issuerFee")}
              info={t("xrp.addToken.steps.review.issuerFeeTooltip")}
            />
          }
          value={<TransferFee token={token} />}
        />
        <Row
          label={t("xrp.manageAssets.lockedAmount")}
          value={<LockedAmount currency={account.currency} />}
        />
        {isIou && limit ? (
          <Row
            label={t("xrp.manageAssets.balanceLimit")}
            value={
              <Discreet>
                {formatTrustLimit({
                  limit,
                  locale,
                  discreet,
                  unit: token.units[0],
                  maximumLabel: t("xrp.addToken.steps.settings.maximum"),
                })}
              </Discreet>
            }
          />
        ) : null}
        {isIou ? (
          <Row
            label={
              <LabelWithInfo
                label={t("xrp.rippling.label")}
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
              appearance="transparent"
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
                <span className="flex w-full">{deleteButton}</span>
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
