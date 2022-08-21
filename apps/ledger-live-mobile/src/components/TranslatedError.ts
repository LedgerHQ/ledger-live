import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

type Props = {
  error: Error | null | undefined;
  field?: "title" | "description";
};
export default function TranslatedError({ error, field = "title" }: Props) {
  const { t } = useTranslation();
  if (!error) return null;

  if (typeof error !== "object") {
    // this case should not happen (it is supposed to be a ?Error)
    console.error(`TranslatedError invalid usage: ${String(error)}`);

    if (typeof error === "string") {
      return error;
    }

    return null;
  }

  // $FlowFixMe
  const arg: Record<string, any> = {
    message: error.message,
    returnObjects: true,
    ...error,
  };

  if (error.name) {
    // the string id of a simple error message
    const simpleTranslationStringId = `errors.${error.name}.${field}`;
    let translation = t(simpleTranslationStringId, arg);

    if (translation !== simpleTranslationStringId) {
      if (typeof translation === "object" && "productName" in arg) {
        // it has specific translation for different device and platform
        const platform = Platform.OS;
        const device = arg.productName.includes("Nano S") ? "nanoS" : "nanoX";

        if (platform === "ios" && device === "nanoS") {
          /**
           * this case should not happen since you can't nativelly connect a Nano S to an iOS device
           * (but you can in local/dev by using a proxy with the simulator)
           */
          return t(`errors.generic.${field}`, arg);
        }

        // the string id of a detailled (os and device specific) error message
        const detailedTranslationStringId = `errors.${error.name}.${field}.${platform}.${device}`;
        translation = t(detailedTranslationStringId, arg);

        if (translation !== detailedTranslationStringId) {
          return translation;
        }
      } else if (typeof translation === "string") {
        return translation;
      }
    }
  }

  return t(`errors.generic.${field}`, arg);
}
