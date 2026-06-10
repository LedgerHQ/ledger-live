import React from "react";

type MarketTopCardsSectionProps = {
  readonly children: React.ReactNode;
};

export function MarketTopCardsSection({ children }: MarketTopCardsSectionProps) {
  return (
    <section
      className="grid grid-cols-3 gap-24 mb-24"
      data-testid="market-top-cards-section"
      aria-label="market top cards"
    >
      {children}
    </section>
  );
}
