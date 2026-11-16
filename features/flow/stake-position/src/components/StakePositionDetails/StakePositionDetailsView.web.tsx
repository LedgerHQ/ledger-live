import React from "react";
import {
  Avatar,
  Banner,
  Button,
  DescriptionItemValue,
  DialogBody,
  DialogFooter,
  Tag,
} from "@ledgerhq/lumen-ui-react";
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
    <>
      <DialogBody data-testid={testID}>
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-8">
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
              <div className="flex items-center gap-8">
                <Avatar
                  size="xs"
                  src={validator.imageUrl}
                  alt=""
                  fallbackText={validator.initial}
                />
                <DescriptionItemValue>{validator.name}</DescriptionItemValue>
              </div>
            </PositionRow>
            <PositionRow label={labels.address}>
              <DescriptionItemValue>{address}</DescriptionItemValue>
            </PositionRow>
          </div>
          {notice ? <Banner appearance={notice.appearance} description={notice.text} /> : null}
        </div>
      </DialogBody>
      <DialogFooter>
        <div className="flex flex-1 flex-col gap-8">
          {exitAction ? (
            <Button
              appearance="base"
              size="lg"
              isFull
              disabled={exitAction.isDisabled}
              onClick={onSelectExitAction}
            >
              {exitAction.label}
            </Button>
          ) : null}
          <Button appearance="gray" size="lg" isFull onClick={onEarnMore}>
            {labels.earnMore}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
