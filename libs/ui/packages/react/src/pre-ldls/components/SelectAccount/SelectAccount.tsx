import React from "react";
import { Icons } from "../../../assets";
import { CardButton } from "../CardButton/CardButton";

export const SelectAccount = ({ onClick }: { onClick: () => void }) => {
  return (
    <CardButton
      onClick={onClick}
      title="Add new or existing account"
      iconRight={<Icons.Plus size="S" />}
      variant="dashed"
    />
  );
};
