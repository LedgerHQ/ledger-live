import React, { memo } from "react";
import { LayoutContainer } from "./LayoutContainer";
import { TableLayoutToggle } from "./LayoutToggle";

const TableLayoutComponent = () => {
  return (
    <LayoutContainer>
      <TableLayoutToggle />
    </LayoutContainer>
  );
};

export const TableLayout = memo(TableLayoutComponent);
