import React from "react";
import type { ZonePlaceholderProps } from "./ZonePlaceholder.types";

const HEIGHT_CLASS = {
  header: "h-56",
  summary: "h-256",
  address: "h-48",
  actions: "h-64",
  notices: "h-56",
  extras: "h-112",
} as const;

export function ZonePlaceholder({ zone }: ZonePlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-muted ${HEIGHT_CLASS[zone]}`}
      data-testid={`receive-address-zone-${zone}`}
    >
      <span className="body-3 text-muted">{zone}</span>
    </div>
  );
}
