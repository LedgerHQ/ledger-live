import React from "react";
import { Subheader, SubheaderRow } from "@ledgerhq/lumen-ui-react";
import { SectionHeaderAction } from "./SectionHeaderAction";
import { SectionHeaderTitle } from "./SectionHeaderTitle";
import type { SectionHeaderProps } from "./types";

export function SectionHeader(props: SectionHeaderProps) {
  const { title, actionLabel, onActionClick, actionTestId } = props;
  const showSeeAll = props.showSeeAll === true;
  const itemCount = showSeeAll && "itemCount" in props ? props.itemCount : undefined;

  const titleContent = (
    <SectionHeaderTitle title={title} showSeeAll={showSeeAll} itemCount={itemCount} />
  );

  return (
    <Subheader>
      <SubheaderRow className="min-w-0 items-center justify-between gap-4">
        {showSeeAll ? (
          <SubheaderRow
            onClick={props.onSeeAllClick}
            data-testid={props.seeAllTestId}
            className="min-w-0"
          >
            {titleContent}
          </SubheaderRow>
        ) : (
          <div className="flex min-w-0 items-center gap-4">{titleContent}</div>
        )}
        {actionLabel ? (
          <SectionHeaderAction
            actionLabel={actionLabel}
            onActionClick={onActionClick}
            actionTestId={actionTestId}
          />
        ) : null}
      </SubheaderRow>
    </Subheader>
  );
}
