import React from "react";
import { InteractiveIcon, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { InformationFill } from "@ledgerhq/lumen-ui-react/symbols";

type AddressNameDisclaimerProps = Readonly<{
  description: string;
  accessibilityLabel: string;
}>;

export function AddressNameDisclaimer({
  description,
  accessibilityLabel,
}: AddressNameDisclaimerProps): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <InteractiveIcon
          aria-label={accessibilityLabel}
          data-testid="contacts-add-address-name-disclaimer"
          icon={InformationFill}
          iconType="filled"
          size={20}
          type="button"
        />
      </TooltipTrigger>
      <TooltipContent>
        <div className="max-w-256 text-center">{description}</div>
      </TooltipContent>
    </Tooltip>
  );
}
