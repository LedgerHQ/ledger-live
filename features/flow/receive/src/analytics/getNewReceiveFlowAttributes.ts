import type { Feature, Features } from "@shared/feature-flags";

type NewReceiveFlowParams = NonNullable<Features["newReceiveFlow"]["params"]>;

/** The `newReceiveFlow` flag, as a user property and on every event. */
export function getNewReceiveFlowAttributes(
  flag: Feature<NewReceiveFlowParams> | null | undefined,
) {
  return { isEnabled: flag?.enabled ?? false, params: flag?.params };
}
