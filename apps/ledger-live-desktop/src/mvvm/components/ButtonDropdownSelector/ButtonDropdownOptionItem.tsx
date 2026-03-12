import React from "react";
import { Check } from "@ledgerhq/lumen-ui-react/symbols";
import type { ButtonDropdownItem } from "./types";

type Props = {
  readonly item: ButtonDropdownItem;
  readonly isActive: boolean;
  readonly id?: string;
};

function getStateClasses(disabled: boolean | undefined, active: boolean): string {
  if (disabled) return "text-muted";
  if (active) return "bg-surface-hover text-base";
  return "text-muted";
}

export default function ButtonDropdownOptionItem({ item, isActive, id }: Props) {
  return (
    <div
      id={id}
      className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-sm px-12 body-2-semi-bold whitespace-nowrap transition-colors hover:bg-surface-hover ${getStateClasses(
        item.disabled,
        isActive,
      )}`}
    >
      <span>{item.label}</span>
      {isActive && (
        <span style={{ color: "var(--color-primary-c80)" }}>
          <Check size={16} />
        </span>
      )}
    </div>
  );
}
