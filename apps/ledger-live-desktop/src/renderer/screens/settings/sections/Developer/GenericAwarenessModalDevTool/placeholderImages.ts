/** Placeholder images from https://picsum.photos (Lorem Picsum). */
export const PICSUM_IMAGE_WIDTH = 400;
export const PICSUM_IMAGE_HEIGHT = 300;

export const createRandomPicsumSeed = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

export const getPicsumImageUrl = (seed: string = createRandomPicsumSeed()): string =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${PICSUM_IMAGE_WIDTH}/${PICSUM_IMAGE_HEIGHT}`;

/** Stable seed per slide index — used for sample cards. */
export const getPicsumCarouselImageUrl = (slideIndex: number): string =>
  getPicsumImageUrl(`generic-awareness-modal-carousel-${slideIndex}`);
