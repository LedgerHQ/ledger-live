import { resolveContactEditSignerActionLabels } from "./resolveContactEditSignerActionLabels";

export type ContactAddressDetailActionsLabels = ReturnType<
  typeof resolveContactEditSignerActionLabels
>;

export type ResolveContactAddressDetailActionsLabelsOptions = Readonly<{
  t: (key: string, options?: Record<string, unknown>) => string;
}>;

export function resolveContactAddressDetailActionsLabels({
  t,
}: ResolveContactAddressDetailActionsLabelsOptions): ContactAddressDetailActionsLabels {
  return resolveContactEditSignerActionLabels(t);
}
