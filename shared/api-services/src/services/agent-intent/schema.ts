import { z } from "zod";
import { isFunction, mustBeAFunction } from "../../internals";

/**
 * Thunk `extraArgument` contract for the Agent Intent BFF. `getAgentIntentBffUrl` is read on every
 * request, so a tester who switches environments in the debug settings needs no restart.
 */
export const AgentIntentApiExtraSchema = z.object({
  getAgentIntentBffUrl: z.custom<() => string>(isFunction, mustBeAFunction("getAgentIntentBffUrl")),
});
