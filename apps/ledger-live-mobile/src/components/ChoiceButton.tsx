import React, { ReactNode } from "react";
import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button";
import Button from "./wrappedUi/Button";
import { ActionButtonEventProps } from "./FabActions";

type ChoiceButtonProps = Partial<ActionButtonEventProps> & {
  disabled?: boolean;
  onSelect: ({
    navigationParams,
    enableActions,
    linkUrl,
  }: {
    navigationParams: ActionButtonEventProps["navigationParams"];
    enableActions: ActionButtonEventProps["enableActions"];
    linkUrl: ActionButtonEventProps["linkUrl"];
  }) => void;
  label: ReactNode;
  Icon?: ButtonProps["Icon"];
  event: string;
  eventProperties?: unknown;
};

const ChoiceButton = ({
  event,
  eventProperties,
  disabled,
  label,
  Icon,
  onSelect,
  navigationParams,
  linkUrl,
  enableActions,
}: ChoiceButtonProps) => (
  <Button
    onPress={() => onSelect({ navigationParams, enableActions, linkUrl })}
    type={"color"}
    outline
    size={"small"}
    disabled={disabled}
    Icon={Icon}
    iconPosition={"left"}
    event={event}
    eventProperties={eventProperties}
    mr={3}
  >
    {label}
  </Button>
);

export default ChoiceButton;
