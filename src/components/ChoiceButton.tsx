import React, { ReactNode } from "react";
import Button from "./wrappedUi/Button";

type ChoiceButtonProps = {
  disabled?: boolean;
  onSelect: Function;
  label: ReactNode;
  description?: ReactNode;
  Icon: any;
  extra?: ReactNode;
  event: string;
  eventProperties: any;
  navigationParams?: any[];
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
  enableActions,
}: ChoiceButtonProps) => (
  <Button
    onPress={() => onSelect({ navigationParams, enableActions })}
    type={"shade"}
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
