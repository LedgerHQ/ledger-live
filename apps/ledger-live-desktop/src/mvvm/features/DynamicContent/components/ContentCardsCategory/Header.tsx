import React from "react";

import { Link } from "@ledgerhq/lumen-ui-react";
import HardwareCarouselCloseAllLink from "../../hardwareCarousel/components/HardwareCarouselCloseAllLink";

type HeaderProps = Readonly<{
  title?: string;
  cta?: string;
  centered?: boolean;
  closeAllCardIds?: readonly string[];
  onCtaPress?: () => void;
}>;

export default Header;

function Header({ title, cta, centered = false, closeAllCardIds, onCtaPress }: HeaderProps) {
  const showCloseAll = Boolean(closeAllCardIds?.length);
  const showHeaderCta = Boolean(onCtaPress && cta && !centered && !showCloseAll);
  const hasTitleRow = Boolean(title || showHeaderCta || showCloseAll);

  if (!hasTitleRow) {
    return null;
  }

  return (
    <div
      className={`mb-12 flex items-center gap-16 ${centered ? "justify-center" : "justify-between"}`}
      data-testid="content-cards-category-header"
    >
      {title ? (
        <h2 className="m-0 min-w-0 shrink truncate heading-4-semi-bold text-base">{title}</h2>
      ) : null}
      {showCloseAll && closeAllCardIds ? (
        <HardwareCarouselCloseAllLink cardIds={closeAllCardIds} />
      ) : null}
      {showHeaderCta ? (
        <Link
          appearance="accent"
          className="shrink-0"
          onClick={onCtaPress}
          size="sm"
          underline={false}
        >
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
