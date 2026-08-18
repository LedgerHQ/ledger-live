export type CarouselActions = {
  /** @param displayedPosition Visual slot for analytics (may include a leading upsell offset). */
  logSlideClick: (cardId: string, displayedPosition?: number) => void;
  /**
   * @param index Index into `portfolioCards` (dismiss target).
   * @param displayedPosition Visual slot for analytics (may include a leading upsell offset).
   */
  dismissCard: (index: number, displayedPosition?: number) => void;
};
