import React from "react";
import {
  InteractiveIcon,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";

export function InfoTooltip(props: Readonly<{ title: string; info: string }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <InteractiveIcon
          icon={Information}
          size={16}
          iconType="stroked"
          accessibilityLabel={props.title}
        />
      </TooltipTrigger>
      <TooltipContent
        title={props.title}
        content={
          <Text typography="body1" lx={{ color: "base" }}>
            {props.info}
          </Text>
        }
      />
    </Tooltip>
  );
}
