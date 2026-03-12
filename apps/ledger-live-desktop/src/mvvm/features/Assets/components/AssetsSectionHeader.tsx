import React from "react";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
  SubheaderCount,
} from "@ledgerhq/lumen-ui-react";
import { MAX_ITEM_DISPLAYED } from "../constants";

type AssetSectionHeaderProps = {
  readonly sectionId: string;
  readonly title: string;
  readonly onNavigate: () => void;
  readonly numberOfItems: number;
};

export const AssetsSectionHeader = ({
  sectionId,
  title,
  onNavigate,
  numberOfItems,
}: AssetSectionHeaderProps) => {
  const shouldShowMore = numberOfItems > MAX_ITEM_DISPLAYED;

  return (
    <Subheader>
      <SubheaderRow
        onClick={shouldShowMore ? onNavigate : undefined}
        data-testid={`${sectionId}-section-header-button`}
      >
        <SubheaderTitle>{title}</SubheaderTitle>
        {shouldShowMore && <SubheaderCount value={numberOfItems} />}
        {shouldShowMore && <SubheaderShowMore />}
      </SubheaderRow>
    </Subheader>
  );
};
