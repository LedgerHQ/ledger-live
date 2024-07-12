import React, { memo } from "react";
import { LayoutContainer } from "./LayoutContainer";
import { TableLayoutToggle } from "./LayoutToggle";

const TableLayout = () => {
  return (
    <LayoutContainer>
      <TableLayoutToggle />
    </LayoutContainer>
  );
};

export default memo(TableLayout);
