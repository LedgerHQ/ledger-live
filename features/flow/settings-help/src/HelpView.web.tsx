import React from "react";
import { NavBar, NavBarLeading, NavBarTitle } from "@ledgerhq/lumen-ui-react";
import { SettingsConfirmSheet } from "@features/flow-settings";
import { HelpGroup } from "./components/HelpGroup/HelpGroup";
import type { HelpViewProps } from "./HelpView.types";

export function HelpView({
  title,
  groups,
  confirmation,
  slots,
  whileConfirming,
  testID,
}: HelpViewProps) {
  return (
    <div className="flex flex-col gap-24 pb-32" data-testid={testID}>
      <NavBar>
        <NavBarLeading>
          <NavBarTitle>{title}</NavBarTitle>
        </NavBarLeading>
      </NavBar>
      {groups.map(group => (
        <HelpGroup key={group.id} group={group} slots={slots} />
      ))}
      <SettingsConfirmSheet {...confirmation} />
      {confirmation.isOpen ? whileConfirming : null}
    </div>
  );
}
