export type CardArtworkProps = Readonly<{
  /** Fades the bottom of the card face into the background behind it. */
  isFaded?: boolean;
  /** @platform web `md` fills its container at the list height, `lg` keeps the card ratio up to 387px wide. */
  size?: "md" | "lg";
}>;
