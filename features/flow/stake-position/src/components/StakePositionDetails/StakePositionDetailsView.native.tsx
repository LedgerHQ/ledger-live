import React from "react";
import {
  AmountDisplay,
  Avatar,
  Banner,
  Box,
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  DescriptionItemValue,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { PositionRow } from "../PositionRows";
import type { StakePositionDetailsViewProps } from "./StakePositionDetailsView.types";

function RewardsHeadline({
  title,
  rewards,
}: Readonly<{ title: string; rewards: NonNullable<StakePositionDetailsViewProps["rewards"]> }>) {
  const { amount, headline } = rewards;
  return (
    <Box lx={{ gap: "s4" }}>
      <Text typography="body3" lx={{ color: "muted" }}>
        {title}
      </Text>
      {headline ? (
        <AmountDisplay
          size="sm"
          value={headline.value}
          formatter={headline.formatter}
          hidden={headline.hidden}
          animate={false}
        />
      ) : null}
      <Text
        typography={headline ? "body3" : "heading1SemiBold"}
        lx={{ color: headline ? "muted" : "base" }}
      >
        {amount.crypto}
      </Text>
    </Box>
  );
}

export function StakePositionDetailsView({
  labels,
  rewards,
  balance,
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
  return (
    <Box lx={{ gap: "s24" }} testID={testID}>
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
                  onPress={onSelectExitAction}
                >
                  {exitAction.label}
                </Button>
              </CardTrailing>
            ) : null}
          </CardHeader>
        </Card>
      ) : null}
      {notice ? <Banner appearance={notice.appearance} description={notice.text} /> : null}
      <Box lx={{ gap: "s12" }}>
        <Text accessibilityRole="header" typography="heading5SemiBold" lx={{ color: "base" }}>
          {labels.sectionTitle}
        </Text>
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
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
              <DescriptionItemValue>{account.name}</DescriptionItemValue>
              {account.icon}
            </Box>
          </PositionRow>
        ) : null}
        {validator ? (
          <PositionRow label={labels.validator}>
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
              <DescriptionItemValue>{validator.name}</DescriptionItemValue>
              <Avatar size="xs" src={validator.imageUrl} fallbackText={validator.initial} />
            </Box>
          </PositionRow>
        ) : null}
      </Box>
      {showEarnMore ? (
        <Button appearance="base" size="lg" isFull onPress={onEarnMore}>
          {labels.earnMore}
        </Button>
      ) : null}
    </Box>
  );
}
