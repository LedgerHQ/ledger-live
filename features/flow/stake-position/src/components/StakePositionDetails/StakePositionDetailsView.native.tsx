import React from "react";
import { Avatar, Banner, Box, Button, DescriptionItemValue, Tag } from "@ledgerhq/lumen-ui-rnative";
import { PositionAmount, PositionRow } from "../PositionRows";
import type { StakePositionDetailsViewProps } from "./StakePositionDetailsView.types";

export function StakePositionDetailsView({
  labels,
  balance,
  rewards,
  status,
  apy,
  validator,
  address,
  exitAction,
  notice,
  onEarnMore,
  onSelectExitAction,
  testID,
}: StakePositionDetailsViewProps) {
  return (
    <Box lx={{ gap: "s24" }} testID={testID}>
      <Box lx={{ gap: "s12" }}>
        <PositionRow label={labels.balance}>
          <PositionAmount amount={balance} />
        </PositionRow>
        {rewards ? (
          <PositionRow label={labels.rewards}>
            <PositionAmount amount={rewards} />
          </PositionRow>
        ) : null}
        <PositionRow label={labels.status}>
          <Tag size="sm" appearance={status.appearance} label={status.label} />
        </PositionRow>
        <PositionRow label={labels.apy}>
          <DescriptionItemValue>{apy}</DescriptionItemValue>
        </PositionRow>
        <PositionRow label={labels.validator}>
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
            <Avatar size="xs" src={validator.imageUrl} fallbackText={validator.initial} />
            <DescriptionItemValue>{validator.name}</DescriptionItemValue>
          </Box>
        </PositionRow>
        <PositionRow label={labels.address}>
          <DescriptionItemValue>{address}</DescriptionItemValue>
        </PositionRow>
      </Box>
      {notice ? <Banner appearance={notice.appearance} description={notice.text} /> : null}
      <Box lx={{ gap: "s12" }}>
        {exitAction ? (
          <Button
            appearance="base"
            size="lg"
            isFull
            disabled={exitAction.isDisabled}
            onPress={onSelectExitAction}
          >
            {exitAction.label}
          </Button>
        ) : null}
        <Button appearance="gray" size="lg" isFull onPress={onEarnMore}>
          {labels.earnMore}
        </Button>
      </Box>
    </Box>
  );
}
