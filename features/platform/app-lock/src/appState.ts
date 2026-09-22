export function isAppBackgrounded(nextState: string, platform: string): boolean {
  return platform === "ios" ? nextState === "background" : /inactive|background/.test(nextState);
}
