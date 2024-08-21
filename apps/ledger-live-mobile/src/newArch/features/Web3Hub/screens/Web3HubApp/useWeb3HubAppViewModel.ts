import { useQuery } from "@tanstack/react-query";
import { fetchManifestById, fetchManifestByIdMock } from "LLM/features/Web3Hub/utils/api/manifests";
import { useLocale } from "~/context/Locale";

export const queryKey = (manifestId: string, locale: string) => [
  "web3hub/manifest",
  manifestId,
  locale,
];

const isInTest = process.env.NODE_ENV === "test" || !!process.env.MOCK_WEB3HUB;
const queryFn = isInTest ? fetchManifestByIdMock : fetchManifestById;

export default function useWeb3HubAppViewModel(manifestId: string) {
  const { locale } = useLocale();

  const manifestQuery = useQuery({
    queryKey: queryKey(manifestId, locale),
    queryFn: queryFn(manifestId, locale),
  });

  return {
    manifest: manifestQuery.data,
    isLoading: manifestQuery.isLoading,
  };
}
