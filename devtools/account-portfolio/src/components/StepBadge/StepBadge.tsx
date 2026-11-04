import { Tag } from "@ledgerhq/lumen-ui-react";

/** Where a step stands: done, or what to say when it is the one to do next. */
export function StepBadge({ done, nextLabel }: Readonly<{ done: boolean; nextLabel?: string }>) {
  if (done) return <Tag appearance="success" size="sm" label="Done" />;
  if (nextLabel) return <Tag appearance="accent" size="sm" label={nextLabel} />;
  return null;
}
