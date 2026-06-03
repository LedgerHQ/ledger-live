/** Static images from https://shop.ledger.com/pages/ledger-wallet */
const SHOPIFY_IMAGE_WIDTH = 800;

const shopifyImage = (file: string, version: number): string =>
  `https://cdn.shopify.com/s/files/1/2974/4858/files/${file}?v=${version}&width=${SHOPIFY_IMAGE_WIDTH}`;

const NAMED_PLACEHOLDER_IMAGES = {
  default: shopifyImage("lw.webp", 1775642601),
  "sample-feature-intro-app-start": shopifyImage("entries_visuals_mob.webp", 1738082910),
  "sample-feature-intro-banner": shopifyImage("recovery_solutions_desktop.webp", 1760980844),
  "sample-prompt-app-start":
    "https://images.ctfassets.net/ge894kijjvls/5Lky02Ow8goZhGWEvYFh4Q/c80cf0db8d69dd5532a3e31bdac73c04/ksp3.webp",
  "sample-prompt-banner": shopifyImage("ledger-stax-face.webp", 1738140795),
} as const;

export const DEV_TOOL_CAROUSEL_IMAGES = [
  shopifyImage("flex_magenta_front_desktop.webp", 1760980832),
  "https://images.ctfassets.net/ge894kijjvls/27KBUAvGe0ux3M1QLsDNkV/bbb4e0279bfb72904375890cd5dc00b5/ksp1.webp",
  shopifyImage("classic_nanos_desktop.webp", 1760980844),
] as const;

export const getDevToolPlaceholderImageUrl = (
  key: keyof typeof NAMED_PLACEHOLDER_IMAGES | string = "default",
): string =>
  key in NAMED_PLACEHOLDER_IMAGES
    ? NAMED_PLACEHOLDER_IMAGES[key as keyof typeof NAMED_PLACEHOLDER_IMAGES]
    : NAMED_PLACEHOLDER_IMAGES.default;

export const getDevToolCarouselImageUrl = (slideIndex: number): string =>
  DEV_TOOL_CAROUSEL_IMAGES[slideIndex % DEV_TOOL_CAROUSEL_IMAGES.length];
