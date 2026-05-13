import React, { type ReactNode } from "react";
import { SectionHeader, type SectionHeaderProps } from "./SectionHeader";

type AssetDetailSectionProps = SectionHeaderProps & {
  children: ReactNode;
};

export function AssetDetailSection({
  children,
  ...headerProps
}: Readonly<AssetDetailSectionProps>) {
  return (
    <div className="flex flex-col gap-12">
      <SectionHeader {...headerProps} />
      <div className="text-body">{children}</div>
    </div>
  );
}
