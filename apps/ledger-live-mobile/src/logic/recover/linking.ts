import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

function appendQueryParams(
  uri: string,
  additionalQueryParams?: Record<string, string>,
): string {
  const queryParams = new URLSearchParams();
  if (additionalQueryParams) {
    for (const [key, value] of Object.entries(additionalQueryParams)) {
      queryParams.append(key, encodeURIComponent(value));
    }
  }
  const uriObj = new URL(uri);
  uriObj.search = uriObj.search
    ? `${uriObj.search}&${queryParams.toString()}`
    : `?${queryParams.toString()}`;
  return uriObj.toString();
}

export function useWelcomeScreenRecoverSigninLink(): string | null {
  const config = useFeature("protectServicesMobile");
  const { enabled, params } = config ?? {};
  if (!enabled) return null;
  const signinURI = params?.login?.loginURI;
  if (!signinURI) return null;
  return appendQueryParams(signinURI, {
    exampleLink1: "ledgerlive://pairingStax",
    /**
     * TODO: depending on the spec, add deeplinks (and implement them if needed)
     * that will be used in the live app to redirect to different parts of the
     * app (e.g. pairing screen for nanoX or Stax, welcome screen)
     * */
  });
}
