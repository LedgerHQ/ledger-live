import { Flex } from "@ledgerhq/react-ui";
import React from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/ButtonV3";
import IconExchange from "~/renderer/icons/Exchange";
import IconSell from "~/renderer/icons/Plus";
import IconReceive from "~/renderer/icons/Receive";
import IconSend from "~/renderer/icons/Send";
import IconSwap from "~/renderer/icons/Swap";
import IconCoins from "~/renderer/icons/Coins";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

type Props = {
  onClick: () => void;
  iconComponent: JSX.Element;
  labelComponent: React.ReactNode;
  event?: string;
  eventProperties?: Record<string, unknown>;
  disabled?: boolean;
  accountActionsTestId?: string;
};

export const ActionDefault = ({
  onClick,
  iconComponent,
  labelComponent,
  event,
  eventProperties,
  disabled,
  accountActionsTestId,
}: Props) => (
  <Button
    variant="color"
    onClick={onClick}
    event={event}
    eventProperties={eventProperties}
    disabled={disabled}
    buttonTestId={accountActionsTestId}
  >
    <Flex flexDirection="row" alignItems="center">
      {iconComponent ? <Flex mr="8px">{iconComponent}</Flex> : null} {labelComponent}
    </Flex>
  </Button>
);
export const SendActionDefault = ({ onClick }: { onClick: () => void }) => (
  <ActionDefault
    onClick={onClick}
    iconComponent={<IconSend size={14} />}
    labelComponent={<Trans i18nKey="send.title" />}
    accountActionsTestId={"send-button"}
  />
);
export const ReceiveActionDefault = ({ onClick }: { onClick: () => void }) => (
  <ActionDefault
    onClick={onClick}
    iconComponent={<IconReceive size={14} />}
    labelComponent={<Trans i18nKey="receive.title" />}
    accountActionsTestId="receive-account-action-button"
  />
);
export const SwapActionDefault = ({ onClick }: { onClick: () => void }) => {
  return (
    <ActionDefault
      onClick={onClick}
      iconComponent={<IconSwap size={14} />}
      labelComponent={<Trans i18nKey="sidebar.swap" />}
      accountActionsTestId="swap-account-action-button"
    />
  );
};
export const BuyActionDefault = ({ onClick }: { onClick: () => void }) => {
  return (
    <ActionDefault
      onClick={onClick}
      iconComponent={<IconExchange size={14} />}
      labelComponent={<Trans i18nKey="accounts.contextMenu.buy" />}
      accountActionsTestId={"buy-button"}
    />
  );
};
export const SellActionDefault = ({ onClick }: { onClick: () => void }) => {
  return (
    <ActionDefault
      onClick={onClick}
      iconComponent={<IconSell size={14} />}
      labelComponent={<Trans i18nKey="accounts.contextMenu.sell" />}
      accountActionsTestId={"sell-button"}
    />
  );
};
export const StakeActionDefault = ({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) => {
  const label = useGetStakeLabelLocaleBased();
  return (
    <ActionDefault
      key="stake"
      onClick={onClick}
      disabled={disabled}
      iconComponent={<IconCoins size={14} />}
      labelComponent={label}
      accountActionsTestId={"stake-button"}
    />
  );
};
