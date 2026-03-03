import lightBg from "~/renderer/images/backgrounds/light.webp";
import homeBg from "~/renderer/images/backgrounds/home.webp";
import cardBg from "~/renderer/images/backgrounds/card.webp";
import swapBg from "~/renderer/images/backgrounds/swap.webp";
import earnBg from "~/renderer/images/backgrounds/earn.webp";

const PAGE_BACKGROUNDS: Record<string, string> = {
  "/": homeBg,
  "/earn": earnBg,
  "/card-new-wallet": cardBg,
  "/swap": swapBg,
  "/exchange": swapBg,
} as const;

export const BACKGROUND_SIZE = "460px 285px";

let preloaded = false;
export const preloadBackgrounds = () => {
  if (preloaded) return;
  preloaded = true;
  [lightBg, homeBg, cardBg, swapBg, earnBg].forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

export const getPageBackground = (
  pathname: string,
  theme: "light" | "dark",
): string | undefined => {
  const key = pathname === "/" ? "/" : `/${pathname.split("/")[1]}`;
  const dark = PAGE_BACKGROUNDS[key];
  if (!dark) return undefined;
  return theme === "light" ? lightBg : dark;
};
