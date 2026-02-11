import React from "react";
import { Switch } from "@ledgerhq/lumen-ui-react";
import Box from "~/renderer/components/Box";
import { SettingsSectionRow } from "../../../SettingsSection";

type Props = {
  title: React.ReactNode;
  desc: React.ReactNode;
  isEnabled: boolean;
  onToggle: (checked: boolean) => void;
  children?: React.ReactNode;
  dataTestId?: string;
};

const DeveloperClassicInputRow = ({
  title,
  desc,
  isEnabled,
  onToggle,
  children,
  dataTestId,
}: Props) => (
  <SettingsSectionRow title={title} desc={desc} dataTestId={dataTestId}>
    <Box grow horizontal flow={2} alignItems="center">
      {isEnabled ? children : null}
      <Switch selected={isEnabled} onChange={onToggle} />
    </Box>
  </SettingsSectionRow>
);

export default DeveloperClassicInputRow;
