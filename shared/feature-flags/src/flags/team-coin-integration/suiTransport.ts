import { z } from "zod";
import { flagWith } from "../../define";

/**
 * Selects the network transport coin-sui talks to the chain with. Resolution, including the default
 * while this flag is off, lives in `resolveSuiTransport` (live-common).
 */
export const suiTransport = flagWith(
  {
    transport: z.enum(["grpc", "graphql"]),
  },
  {
    enabled: false,
    params: { transport: "grpc" },
  },
);
