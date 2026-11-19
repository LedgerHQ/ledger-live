import { z } from "zod";
import { flagWith } from "../../define";

// `enabled` opens positions from the Earn live app, `params.accountPage` from the account page too.
// Remote values are not parsed with this schema: read `params?.accountPage === true` strictly.
export const earnNativeStakePosition = flagWith({ accountPage: z.boolean().optional() });
