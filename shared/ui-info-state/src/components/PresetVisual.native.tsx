import React from "react";
import { Box, Spot } from "@ledgerhq/lumen-ui-rnative";
import {
  CheckmarkCircleFill,
  DeleteCircleFill,
  InformationFill,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import type { InfoStateProps } from "../InfoState.types";
import { illustrationSlotStyle } from "../styles";

const SPOT_SIZE = 72;

export function PresetVisual(props: InfoStateProps) {
  switch (props.preset) {
    case "illustration":
      return <Box lx={illustrationSlotStyle}>{props.illustration}</Box>;
    case "spot":
      return <Spot size={props.spotProps.size ?? SPOT_SIZE} icon={props.spotProps.icon} />;
    case "success":
      return <Spot appearance="success" icon={CheckmarkCircleFill} size={SPOT_SIZE} />;
    case "error":
      return <Spot appearance="error" icon={DeleteCircleFill} size={SPOT_SIZE} />;
    case "info":
      return <Spot appearance="muted" icon={InformationFill} size={SPOT_SIZE} />;
    case "text":
      return null;
    default:
      return assertNever(props);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled info state preset: ${JSON.stringify(value)}`);
}
