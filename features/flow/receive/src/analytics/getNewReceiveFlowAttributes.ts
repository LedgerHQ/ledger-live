import type { Feature, Features } from "@shared/feature-flags";

type NewReceiveFlowParams = NonNullable<Features["newReceiveFlow"]["params"]>;

export type NewReceiveFlowAttributes = Readonly<{
  isEnabled: boolean;
  params: NewReceiveFlowParams | undefined;
}>;

export function getNewReceiveFlowAttributes(
  flag: Feature<NewReceiveFlowParams> | null | undefined,
): NewReceiveFlowAttributes {
  return { isEnabled: flag?.enabled ?? false, params: flag?.params };
}
