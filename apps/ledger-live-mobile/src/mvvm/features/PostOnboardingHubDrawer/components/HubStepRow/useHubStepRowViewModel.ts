import type { HubStepRowProps } from ".";

export function useHubStepRowViewModel({
  leadingIcon,
  title,
  description,
  descriptionTestID,
  tag,
  trailing,
  opacity = 1,
}: HubStepRowProps) {
  return {
    leadingIcon,
    title,
    description,
    descriptionTestID,
    tag,
    trailing,
    opacity,
    hasDescription: Boolean(description),
  };
}
