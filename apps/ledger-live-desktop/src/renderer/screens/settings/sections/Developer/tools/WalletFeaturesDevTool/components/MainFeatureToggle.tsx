import React from "react";
import { Switch, Tag } from "@ledgerhq/lumen-ui-react";
import { WALLET_FEATURES_FLAG } from "../constants";
import { MainFeatureToggleProps } from "../types";

export const MainFeatureToggle = ({ isEnabled, onToggle }: MainFeatureToggleProps) => (
  <div className="flex items-center justify-between rounded-md bg-surface p-10">
    <div className="flex items-center gap-4">
      <span className="body-2-semi-bold">{WALLET_FEATURES_FLAG}</span>
      <Tag
        appearance={isEnabled ? "success" : "base"}
        size="sm"
        label={isEnabled ? "Enabled" : "Disabled"}
      />
    </div>
    <Switch name="wallet-features-enabled" selected={isEnabled} onChange={onToggle} />
  </div>
);
