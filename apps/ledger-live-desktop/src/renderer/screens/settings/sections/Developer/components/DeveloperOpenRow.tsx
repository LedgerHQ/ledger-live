import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { SettingsSectionRow } from "../../../SettingsSection";

type Props = {
  title: React.ReactNode;
  desc: React.ReactNode;
  cta: React.ReactNode;
  onOpen: () => void;
  dataTestId?: string;
};

const DeveloperOpenRow = ({ title, desc, cta, onOpen, dataTestId }: Props) => (
  <SettingsSectionRow title={title} desc={desc} dataTestId={dataTestId}>
    <Button size="sm" appearance="accent" onClick={onOpen}>
      {cta}
    </Button>
  </SettingsSectionRow>
);

export default DeveloperOpenRow;
