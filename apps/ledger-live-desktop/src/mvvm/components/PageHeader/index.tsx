import React from "react";
import {
  NavBar,
  NavBarBackButton,
  NavBarTitle,
  NavBarTrailing,
  NavBarDescription,
  NavBarLeading,
} from "@ledgerhq/lumen-ui-react";

type Props = Readonly<{
  title: string;
  /** Optional element rendered next to the title, e.g. a scope badge. */
  extra?: React.ReactNode;
  onBack?: () => void;
  trailing?: React.ReactNode;
}>;

export default function PageHeader({ title, extra, onBack, trailing }: Props) {
  return (
    <NavBar data-testid="page-header">
      {onBack ? <NavBarBackButton onClick={onBack} /> : null}
      <NavBarLeading>
        <NavBarTitle>
          <span data-testid="page-header-title">{title}</span>
        </NavBarTitle>
        {extra ? <NavBarDescription>{extra}</NavBarDescription> : null}
      </NavBarLeading>

      {trailing ? <NavBarTrailing>{trailing}</NavBarTrailing> : null}
    </NavBar>
  );
}
