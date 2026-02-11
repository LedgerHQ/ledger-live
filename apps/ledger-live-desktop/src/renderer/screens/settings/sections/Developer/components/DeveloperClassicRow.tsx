import React from "react";
import { SettingsSectionRow } from "../../../SettingsSection";

type Props = {
  title: React.ReactNode;
  desc: React.ReactNode;
  children: React.ReactNode;
  dataTestId?: string;
};

const DeveloperClassicRow = ({ title, desc, children, dataTestId }: Props) => (
  <SettingsSectionRow title={title} desc={desc} dataTestId={dataTestId}>
    {children}
  </SettingsSectionRow>
);

export default DeveloperClassicRow;
