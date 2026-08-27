import { z } from "zod";
import { flagWith } from "../../define";

/**
 * Selects the network transport coin-sui talks to the chain with. Resolution, including the default
 * while this flag is off, lives in `resolveSuiTransport` (live-common).
 *
 * `json` is deprecated upstream: the Sui Foundation decommissions JSON-RPC on 2026-09-30.
 */
export const suiTransport = flagWith(
  {
    transport: z.enum(["json", "grpc", "graphql"]),
  },
  {
    enabled: false,
    params: { transport: "json" },
  },
);
