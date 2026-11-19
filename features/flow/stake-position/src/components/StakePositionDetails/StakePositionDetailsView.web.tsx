import React from "react";
import {
  AmountDisplay,
  Avatar,
  Banner,
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  DescriptionItemValue,
  DialogBody,
  DialogFooter,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import { PositionRow } from "../PositionRows";
import type { StakePositionAmount } from "../../types";
import type { StakePositionDetailsViewProps } from "./StakePositionDetailsView.types";

function RewardsHeadline({
  title,
  rewards,
}: Readonly<{ title: string; rewards: NonNullable<StakePositionDetailsViewProps["rewards"]> }>) {
  const { amount, headline } = rewards;
  return (
    <div className="flex flex-col" data-testid="stake-position-rewards">
      <span className="body-3 text-muted">{title}</span>
      {headline ? (
        // The design's amount is 32px with 24px decimals; the closest Lumen size is `sm`.
        <AmountDisplay
          className="mt-12"
          size="sm"
          value={headline.value}
          formatter={headline.formatter}
          hidden={headline.hidden}
          animate={false}
        />
      ) : null}
      <span className={headline ? "mt-4 body-3 text-muted" : "mt-12 heading-1-semi-bold text-base"}>
        {amount.crypto}
      </span>
    </div>
  );
}

function InitialDeposit({ amount }: Readonly<{ amount: StakePositionAmount }>) {
  if (!amount.fiat) return <DescriptionItemValue>{amount.crypto}</DescriptionItemValue>;
  return (
    <div className="flex items-center gap-8">
      <span className="body-2 text-muted">{amount.crypto}</span>
      <DescriptionItemValue>{amount.fiat}</DescriptionItemValue>
    </div>
  );
}

export function StakePositionDetailsView({
  labels,
  rewards,
  balance,
  initialDeposit,
  apyBadge,
  status,
  account,
  validator,
  exitAction,
  notice,
  showEarnMore,
  onEarnMore,
  onSelectExitAction,
  testID,
}: StakePositionDetailsViewProps) {
  // Web only, like its design: the key stays out of the mobile catalog.
  const { t } = useTranslation();

  return (
    <>
      <DialogBody data-testid={testID}>
        <div className="flex flex-col gap-24">
          {rewards ? <RewardsHeadline title={labels.totalRewards} rewards={rewards} /> : null}
          {balance || exitAction ? (
            <Card type="info">
              <CardHeader>
                <CardLeading>
                  {balance ? (
                    <CardContent>
                      <CardContentTitle>{balance.crypto}</CardContentTitle>
                      <CardContentDescription>{labels.currentBalance}</CardContentDescription>
                    </CardContent>
                  ) : null}
                </CardLeading>
                {exitAction ? (
                  <CardTrailing>
                    <Button
                      appearance="gray"
                      size="sm"
                      disabled={exitAction.isDisabled}
                      onClick={onSelectExitAction}
                    >
                      {exitAction.label}
                    </Button>
                  </CardTrailing>
                ) : null}
              </CardHeader>
            </Card>
          ) : null}
          {notice ? <Banner appearance={notice.appearance} description={notice.text} /> : null}
          <div className="flex flex-col gap-12">
            <h3 className="heading-5-semi-bold text-base">{labels.sectionTitle}</h3>
            <div className="flex flex-col gap-16">
              {initialDeposit ? (
                <PositionRow label={t("stakePosition.details.initialDeposit")}>
                  <InitialDeposit amount={initialDeposit} />
                </PositionRow>
              ) : null}
              {apyBadge ? (
                <PositionRow label={labels.apy}>
                  <Tag size="sm" appearance="success" label={apyBadge} />
                </PositionRow>
              ) : null}
              <PositionRow label={labels.status}>
                <DescriptionItemValue>{status}</DescriptionItemValue>
              </PositionRow>
              {account ? (
                <PositionRow label={labels.account}>
                  <div className="flex items-center gap-8">
                    <DescriptionItemValue>{account.name}</DescriptionItemValue>
                    {account.icon}
                  </div>
                </PositionRow>
              ) : null}
              {validator ? (
                <PositionRow label={labels.validator}>
                  <div className="flex items-center gap-8">
                    <DescriptionItemValue>{validator.name}</DescriptionItemValue>
                    <Avatar
                      size="xs"
                      src={validator.imageUrl}
                      alt=""
                      fallbackText={validator.initial}
                    />
                  </div>
                </PositionRow>
              ) : null}
            </div>
          </div>
        </div>
      </DialogBody>
      {showEarnMore ? (
        <DialogFooter>
          <Button appearance="base" size="lg" isFull onClick={onEarnMore}>
            {labels.earnMore}
          </Button>
        </DialogFooter>
      ) : null}
    </>
  );
}
