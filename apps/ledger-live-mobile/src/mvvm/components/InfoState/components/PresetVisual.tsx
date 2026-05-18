import React from "react";
import { Box, Spot } from "@ledgerhq/lumen-ui-rnative";
import type { InfoStateProps } from "../types";
import { illustrationSlotStyle } from "../styles";

const SPOT_SIZE = 72;

export function PresetVisual(props: InfoStateProps) {
  switch (props.preset) {
    case "illustration":
      return <Box lx={illustrationSlotStyle}>{props.illustration}</Box>;
    case "spot":
      return <Spot appearance="icon" size={SPOT_SIZE} icon={props.spotProps.icon} />;
    case "success":
      return <Spot appearance="check" size={SPOT_SIZE} />;
    case "error":
      return <Spot appearance="error" size={SPOT_SIZE} />;
    case "info":
      return <Spot appearance="info" size={SPOT_SIZE} />;
    case "text":
      return null;
    default:
      return assertNever(props);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled info state preset: ${JSON.stringify(value)}`);
}
