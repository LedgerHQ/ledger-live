import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import type { InfoStateProps } from "../types";

const SPOT_SIZE = 72;

export function PresetVisual(props: InfoStateProps) {
  switch (props.preset) {
    case "illustration":
      return (
        <div className="flex h-[208px] w-[208px] items-center justify-center overflow-hidden rounded-sm">
          {props.illustration}
        </div>
      );
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
