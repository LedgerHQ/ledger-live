import React from "react";
import { NavBar, NavBarBackButton, NavBarTitle } from "@ledgerhq/lumen-ui-react";

type Props = Readonly<{
  title: string;
  onBack?: () => void;
}>;

export default function PageHeader({ title, onBack }: Props) {
  return (
    <NavBar data-testid="page-header">
      {onBack ? <NavBarBackButton onClick={onBack} /> : null}
      <NavBarTitle className="text-base">{title}</NavBarTitle>
    </NavBar>
  );
}
