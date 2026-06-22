import React from "react";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
  SubheaderCount,
} from "@ledgerhq/lumen-ui-react";
import {
  ASSETS_PAGE_CATEGORY_STOCKS,
  MAX_ITEM_DISPLAYED,
  MAX_STOCKS_TO_DISPLAY,
} from "../constants";

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
  const maxItemsDisplayed =
    sectionId === ASSETS_PAGE_CATEGORY_STOCKS ? MAX_STOCKS_TO_DISPLAY : MAX_ITEM_DISPLAYED;
  const shouldShowMore = numberOfItems > maxItemsDisplayed;

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
