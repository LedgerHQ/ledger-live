import React, { type ReactNode } from "react";
import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-react";
import type { SettingsPageViewModel } from "./useSettingsPageViewModel";

type SettingsPageViewProps = SettingsPageViewModel &
  Readonly<{ children: ReactNode; testID?: string }>;

export function SettingsPageView({
  title,
  tabs,
  selectedSection,
  onSelectTab,
  children,
  testID,
}: SettingsPageViewProps) {
  return (
    <div className="flex flex-col gap-24" data-testid={testID}>
      <h1 className="heading-3">{title}</h1>
      <SegmentedControl
        selectedValue={selectedSection}
        onSelectedChange={onSelectTab}
        appearance="no-background"
        tabLayout="fit"
        aria-label={title}
      >
        {tabs.map(tab => (
          <SegmentedControlButton
            key={tab.id}
            value={tab.id}
            data-testid={`settings-tab-${tab.id}`}
          >
            {tab.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControl>
      <div className="flex flex-col gap-24">{children}</div>
    </div>
  );
}
