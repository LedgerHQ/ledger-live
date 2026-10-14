import { z } from "zod";

// Called once here, so an env var that resolves to an empty string still fails at app init.
function isUrlGetter(value: unknown): value is () => string {
  if (typeof value !== "function") return false;
  const url: unknown = value();
  return typeof url === "string" && url.length > 0;
}

/**
 * Thunk `extraArgument` contract for every Countervalues-Service-backed api. The app supplies the
 * CVS URL at store configuration time, so this package owns no env/config dependency.
 */
export const CvsApiExtraSchema = z.object({
  /**
   * Read on every request, and not once at store creation: the developer settings switch
   * `LEDGER_COUNTERVALUES_API` to staging while the app runs, and the next request must follow.
   */
  getCountervaluesServiceUrl: z.custom<() => string>(isUrlGetter, {
    message: "getCountervaluesServiceUrl must be a function returning a non-empty url",
  }),
});
