// @flow
import React from "react";
import { Trans } from "react-i18next";
import IconReceive from "~/renderer/icons/Receive";
import IconSend from "~/renderer/icons/Send";
import IconSwap from "~/renderer/icons/Swap";
import IconExchange from "~/renderer/icons/Exchange";
import IconSell from "~/renderer/icons/Plus";
// $FlowFixMe
import Button from "~/renderer/components/ButtonV3";
import { Flex } from "@ledgerhq/react-ui";
type Props = {
  onClick: () => void,
  iconComponent: any,
  labelComponent: any,
  event?: string,
  eventProperties?: Object,
  disabled?: boolean,
  actionName?: String,
};

export const ActionDefault = ({
  onClick,
  iconComponent,
  labelComponent,
  event,
  eventProperties,
  disabled,
  actionName,
}: Props) => (
  <Button
    variant="color"
    onClick={onClick}
    event={event}
    eventProperties={eventProperties}
    disabled={disabled}
    data-test-id={`account-${actionName}-button`}
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
    actionName={"send"}
  />
);

export const ReceiveActionDefault = ({ onClick }: { onClick: () => void }) => (
  <ActionDefault
    onClick={onClick}
    iconComponent={<IconReceive size={14} />}
    labelComponent={<Trans i18nKey="receive.title" />}
    actionName={"receive"}
  />
);

export const SwapActionDefault = ({ onClick }: { onClick: () => void }) => {
  return (
    <ActionDefault
      onClick={onClick}
      iconComponent={<IconSwap size={14} />}
      labelComponent={<Trans i18nKey="sidebar.swap" />}
      actionName={"swap"}
    />
  );
};

export const BuyActionDefault = ({ onClick }: { onClick: () => void }) => {
  return (
    <ActionDefault
      onClick={onClick}
      iconComponent={<IconExchange size={14} />}
      labelComponent={<Trans i18nKey="accounts.contextMenu.buy" />}
      actionName={"buy"}
    />
  );
};

export const SellActionDefault = ({ onClick }: { onClick: () => void }) => {
  return (
    <ActionDefault
      onClick={onClick}
      iconComponent={<IconSell size={14} />}
      labelComponent={<Trans i18nKey="accounts.contextMenu.sell" />}
      actionName={"sell"}
    />
  );
};
