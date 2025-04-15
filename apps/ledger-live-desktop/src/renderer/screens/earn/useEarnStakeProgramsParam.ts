import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

export function useEarnStakeProgramsParam(): Record<string, string> | undefined {
  const stakePrograms = useFeature("stakePrograms");

  const redirects = stakePrograms?.params?.redirects ?? {};
  const result: Record<string, string> = {};
  const keys = Object.keys(redirects);
  if (keys.length === 0) {
    return undefined;
  }
  keys.forEach(key => {
    result[key] = redirects[key].platform;
  });

  return result;
}
