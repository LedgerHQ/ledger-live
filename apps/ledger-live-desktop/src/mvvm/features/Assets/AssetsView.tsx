import React, { Fragment } from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { AssetSection } from "./components/AssetsSection";
import { AssetsViewProps } from "./types";

export function AssetsView({ isLoading, sections, afterCryptosSection }: AssetsViewProps) {
  if (isLoading) return <Skeleton component="table" />;

  return (
    <div className="flex flex-col gap-32" data-testid="assets-view">
      {sections.map(function renderSection(section) {
        return (
          <Fragment key={section.sectionId}>
            <AssetSection {...section} />
            {section.sectionId === "cryptos" && afterCryptosSection}
          </Fragment>
        );
      })}
    </div>
  );
}
