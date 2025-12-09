import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

const NETWORK_SUPPORTING_MEMO_TAG: string[] = [
  "cardano",
  "casper",
  "hedera",
  "icp",
  "solana",
  "stacks",
  "stellar",
  "ton",
  "xrp",
];

export function useMemoTag(network: string) {
  const lldMemoTag = useFeature("lldMemoTag");
  console.log("lldMemoTag", lldMemoTag);
  if (!lldMemoTag?.enabled) {
    return { showMemoTagInput: false };
  }

  console.log("NETWORK_SUPPORTING_MEMO_TAG", NETWORK_SUPPORTING_MEMO_TAG);
  return { showMemoTagInput: NETWORK_SUPPORTING_MEMO_TAG.includes(network) };
}
