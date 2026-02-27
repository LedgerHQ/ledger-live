import React from "react";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-react";

type AssetSectionHeaderProps = {
  readonly sectionId: string;
  readonly title: string;
  readonly onNavigate: () => void;
};

export const AssetsSectionHeader = ({ sectionId, title, onNavigate }: AssetSectionHeaderProps) => {
  return (
    <Subheader>
      <SubheaderRow onClick={onNavigate} data-testid={`${sectionId}-section-header-button`}>
        <SubheaderTitle>{title}</SubheaderTitle>
        <SubheaderShowMore />
      </SubheaderRow>
    </Subheader>
  );
};
