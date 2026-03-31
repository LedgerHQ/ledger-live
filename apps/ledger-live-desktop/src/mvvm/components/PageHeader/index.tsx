import React from "react";
import { NavBar, NavBarBackButton, NavBarTitle, NavBarTrailing } from "@ledgerhq/lumen-ui-react";

type Props = Readonly<{
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
}>;

export default function PageHeader({ title, onBack, trailing }: Props) {
  return (
    <NavBar data-testid="page-header">
      {onBack ? <NavBarBackButton onClick={onBack} /> : null}
      <NavBarTitle>{title}</NavBarTitle>
      {trailing ? <NavBarTrailing>{trailing}</NavBarTrailing> : null}
    </NavBar>
  );
}
