import React, { ReactNode } from "react";
import Button from "./wrappedUi/Button";

type ChoiceButtonProps = {
  disabled?: boolean;
  onSelect: any;
  label: ReactNode;
  description?: ReactNode;
  Icon: any;
  extra?: ReactNode;
  event: string;
  eventProperties: any;
  navigationParams?: any[];
  linkUrl?: string;
  enableActions?: string;
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
