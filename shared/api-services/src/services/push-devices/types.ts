import type { z } from "zod";
import type { PushDevicesApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the Push Devices service. */
export type PushDevicesApiExtra = z.infer<typeof PushDevicesApiExtraSchema>;
