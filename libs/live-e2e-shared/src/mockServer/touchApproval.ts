export type ScreenEvent = Readonly<{ text: string; x: number; y: number }>;

const APPROVAL_LABEL = /^(confirm|approve|accept|continue)\b/i;

export const isApprovalLabel = (text: string) => APPROVAL_LABEL.test(text.trim());

const screenLine = (events: readonly ScreenEvent[], y: number) =>
  events
    .filter(event => event.y === y)
    .map(event => event.text)
    .join(" ");

const isTouchApproval = (events: readonly ScreenEvent[], event: ScreenEvent) =>
  isApprovalLabel(event.text) && !screenLine(events, event.y).includes("?");

export const touchApprovalTarget = (events: readonly ScreenEvent[]): ScreenEvent | undefined =>
  events
    .filter(event => isTouchApproval(events, event))
    .reduce<ScreenEvent | undefined>(
      (selected, event) => (!selected || event.y >= selected.y ? event : selected),
      undefined,
    );
