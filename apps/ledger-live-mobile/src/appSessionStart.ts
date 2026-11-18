let appSessionStartedAt = Date.now();

export function markAppSessionStart(): void {
  appSessionStartedAt = Date.now();
}

export function getAppSessionStartedAt(): number {
  return appSessionStartedAt;
}
