const RELEASE_CONFLICTS_TITLE = ":rotating_light: Release merge conflicts";
const HOTFIX_CONFLICTS_TITLE = ":rotating_light: Hotfix merge conflicts";
const HOTFIX_RELEASE_CONFLICTS_TITLE = ":rotating_light: Hotfix Release merge conflicts";

export function isMergeConflictsPr(title: string): boolean {
  const normalizedTitle = title.trimEnd();

  return (
    normalizedTitle.endsWith(RELEASE_CONFLICTS_TITLE) ||
    normalizedTitle.endsWith(HOTFIX_CONFLICTS_TITLE) ||
    normalizedTitle.endsWith(HOTFIX_RELEASE_CONFLICTS_TITLE)
  );
}

const AUTOMATED_PLATFORM_PREFIX = /^\[(?:LWDM|LWD|LWM)\] /;

export function stripPlatformPrefix(title: string): string {
  return title.replace(AUTOMATED_PLATFORM_PREFIX, "");
}
