import React from "react";

import { Link, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";

type HeaderProps = Readonly<{
  title?: string;
  cta?: string;
  centered?: boolean;
  onCtaPress?: () => void;
}>;

export default Header;

function Header({ title, cta, centered = false, onCtaPress }: HeaderProps) {
  const showHeaderCta = Boolean(onCtaPress && cta && !centered);

  if (!title && !showHeaderCta) {
    return null;
  }

  return (
    <div
      className={`mb-12 flex items-center gap-16 ${centered ? "justify-center" : "justify-between"}`}
      data-testid="content-cards-category-header"
    >
      {title ? (
        <Subheader className="min-w-0 flex-1">
          <SubheaderRow className={centered ? "justify-center" : undefined}>
            <SubheaderTitle>{title}</SubheaderTitle>
          </SubheaderRow>
        </Subheader>
      ) : null}
      {showHeaderCta ? (
        <Link onClick={onCtaPress} size="sm">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
