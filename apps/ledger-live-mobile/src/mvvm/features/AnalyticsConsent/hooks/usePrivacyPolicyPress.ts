import { track } from "@shared/analytics";
import { useCallback } from "react";
import { urls } from "~/utils/urls";
import { useLocale } from "~/context/Locale";
import { Linking } from "react-native";

interface UsePrivacyPolicyPressProps {
  flow: string;
  shouldWeTrack: boolean;
}

const usePrivacyPolicyPress = ({ flow, shouldWeTrack }: UsePrivacyPolicyPressProps) => {
  const { locale } = useLocale();

  const privacyPolicyUrl =
    (urls.privacyPolicy as Record<string, string>)[locale] || urls.privacyPolicy.en;

  const onPrivacyPolicyPress = useCallback(() => {
    Linking.openURL(privacyPolicyUrl);
    track(
      "button_clicked",
      {
        button: "Privacy policy",
        flow,
      },
      { mandatory: !!shouldWeTrack },
    );
  }, [privacyPolicyUrl, shouldWeTrack, flow]);

  return onPrivacyPolicyPress;
};

export default usePrivacyPolicyPress;
