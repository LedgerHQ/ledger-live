import React from "react";
import { SettingsSectionRow } from "../../../SettingsSection";

type Props = {
  title: React.ReactNode;
  value: React.ReactNode;
  dataTestId?: string;
};

const DeveloperInfoRow = ({ title, value, dataTestId }: Props) => (
  <SettingsSectionRow title={title} desc={value} dataTestId={dataTestId} />
);

export default DeveloperInfoRow;
