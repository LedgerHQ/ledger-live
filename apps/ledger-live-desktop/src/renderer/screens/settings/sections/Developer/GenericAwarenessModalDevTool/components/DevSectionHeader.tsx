import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";

type DevSectionHeaderProps = {
  title: string;
  action?: React.ReactNode;
};

export const DevSectionHeader = ({ title, action }: DevSectionHeaderProps) => (
  <div className="flex flex-row flex-wrap items-center justify-between gap-4">
    <Subheader>
      <SubheaderRow>
        <SubheaderTitle>{title}</SubheaderTitle>
      </SubheaderRow>
    </Subheader>
    {action}
  </div>
);
