import { flag } from "../../define";

/**
 * Gates gas sponsorship — paying network fees through a third-party energy provider instead of
 * burning the native asset.
 *
 * On/off only. Which coin families offer it, which provider serves them, and whether one is
 * configured at all lives in each family's remote coin-config.
 */
export const gasSponsorship = flag();
