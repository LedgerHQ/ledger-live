let lastPageEventName: string | undefined;

export function buildFullScreenName(category?: string, name?: string | null): string {
  return (category || "") + (category && name ? " " : "") + (name || "");
}

export function buildPageEventName(fullScreenName: string): string {
  return `Page ${fullScreenName}`;
}

export function getLastPageEventName(): string | undefined {
  return lastPageEventName;
}

export function setLastPageEventName(eventName: string): void {
  lastPageEventName = eventName;
}

export function resetLastPageEventName(): void {
  lastPageEventName = undefined;
}

export function shouldSkipDuplicatePageEvent(eventName: string, avoidDuplicates: boolean): boolean {
  return avoidDuplicates && eventName === lastPageEventName;
}
