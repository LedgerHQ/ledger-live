import React from "react";
import { Switch, Tag } from "@ledgerhq/lumen-ui-react";
import { Check } from "@ledgerhq/lumen-ui-react/symbols";
import { FeatureParamRowProps } from "../types";

export const FeatureParamRow = ({
  paramKey,
  label,
  isEnabled,
  isSelected,
  onToggle,
}: FeatureParamRowProps) => (
  <div
    className={`flex items-center justify-between p-10 transition-opacity ${isEnabled ? "opacity-100" : "opacity-50"}`}
  >
    <div className="flex items-center gap-4">
      <span className="body-3">{label}</span>
      {isSelected && <Tag appearance="success" size="sm" icon={Check} label="ON" />}
    </div>
    <Switch
      name={`wallet-feature-${paramKey}`}
      selected={isSelected}
      onChange={onToggle}
      disabled={!isEnabled}
    />
  </div>
);
