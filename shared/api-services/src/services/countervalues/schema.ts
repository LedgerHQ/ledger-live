import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every Countervalues-Service-backed api. The app supplies the
 * resolved CVS URL at store configuration time, so this package owns no env/config dependency.
 */
export const CvsApiExtraSchema = z.object({
  countervaluesServiceUrl: z.string().min(1),
});
