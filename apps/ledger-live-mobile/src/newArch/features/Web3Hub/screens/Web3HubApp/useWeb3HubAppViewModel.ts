import { useQuery } from "@tanstack/react-query";
import { fetchManifestById, fetchManifestByIdMock } from "LLM/features/Web3Hub/utils/api/manifests";

export const queryKey = (manifestId: string) => ["web3hub/manifest", manifestId];

const isInTest = process.env.NODE_ENV === "test" || !!process.env.MOCK_WEB3HUB;
const queryFn = isInTest ? fetchManifestByIdMock : fetchManifestById;

export default function useWeb3HubAppViewModel(manifestId: string) {
  const manifestQuery = useQuery({
    queryKey: queryKey(manifestId),
    queryFn: queryFn(manifestId),
  });

  return {
    manifest: manifestQuery.data,
    isLoading: manifestQuery.isLoading,
  };
}
