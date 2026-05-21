import React from "react";
import { SubheaderCount, SubheaderShowMore, SubheaderTitle } from "@ledgerhq/lumen-ui-react";

export type SectionHeaderTitleProps = Readonly<{
  title: string;
  showSeeAll: boolean;
  itemCount?: number;
}>;

export function SectionHeaderTitle({ title, showSeeAll, itemCount }: SectionHeaderTitleProps) {
  return (
    <>
      <SubheaderTitle>{title}</SubheaderTitle>
      {showSeeAll && itemCount !== undefined ? <SubheaderCount value={itemCount} /> : null}
      {showSeeAll ? <SubheaderShowMore /> : null}
    </>
  );
}
