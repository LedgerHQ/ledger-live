import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { AssetSection } from "./components/AssetsSection";
import { AssetsViewProps } from "./types";

export const AssetsView = ({ isLoading, sections }: AssetsViewProps) => {
  if (isLoading) return <Skeleton component="table" />;

  return (
    <div className="flex flex-col gap-32" data-testid="assets-view">
      {sections.map(section => (
        <AssetSection key={section.sectionId} {...section} />
      ))}
    </div>
  );
};
