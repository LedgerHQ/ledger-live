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
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { useGetIssuerFeeQuery } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { formatFeesValue } from "@ledgerhq/live-common/flows/send/utils/networkFeesDisplay";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import type { Account } from "@ledgerhq/types-live";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { useSelector } from "LLD/hooks/redux";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { LabelWithInfo } from "../components/LabelWithInfo";
import { OWNER_RESERVE, formatIssuerFee, formatTrustLimit } from "../utils";

type Props = Readonly<{
  account: Account;
  tokenAccount: XrpTokenAccount;
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

export function AssetCard({ account, tokenAccount }: Props) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const discreet = useDiscreetMode();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const { token, xrpResources } = tokenAccount;
  const issuerFee = useGetIssuerFeeQuery(token);
  const isIou = token.tokenType === "iou";
  const limit = xrpResources?.limit;

  const lockedAmount = formatFeesValue({
    locale,
    estimatedFees: OWNER_RESERVE,
    estimatedFeesCountervalue: calculateCountervalue(account.currency, OWNER_RESERVE),
    fiatUnit: counterValueCurrency.units[0],
    displayUnit: account.currency.units[0],
    mode: "both",
  });

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
            <CardContentTitle>{token.name}</CardContentTitle>
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
                : t("xrp.addToken.steps.review.issuerFeeError")
            }
          />
        )}
        <Row
          label={t("xrp.manageAssets.lockedAmount")}
          value={
            <span className="flex items-center gap-4">
              {lockedAmount.displayFeesValue}
              {lockedAmount.secondaryFeesValue ? (
                <span className="body-3 text-muted">{lockedAmount.secondaryFeesValue}</span>
              ) : null}
            </span>
          }
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
              disabled
              data-testid="xrp-manage-assets-edit"
            >
              {t("xrp.manageAssets.edit")}
            </Button>
          ) : null}
          <Button
            appearance="base"
            size="md"
            isFull
            disabled
            data-testid="xrp-manage-assets-delete"
          >
            {t("xrp.manageAssets.delete")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
