import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Platform, Text } from "react-native";
import { useErrorLinks } from "./hooks/useErrorLinks";

type Props = {
  error: Error | null | undefined;
  field?: "title" | "description";
};
export function TranslatedError({ error, field = "title" }: Props): JSX.Element | null {
  const { t } = useTranslation();
  const links = useErrorLinks(error);
  if (!error) return null;

  if (typeof error !== "object") {
    // this case should not happen (it is supposed to be a ?Error)
    console.error(`TranslatedError invalid usage: ${String(error)}`);

    if (typeof error === "string") {
      return <Text>{error}</Text>;
    }

    return null;
  }

  const arg: Error & { returnObjects: boolean; productName?: string[] } = {
    returnObjects: true,
    ...error,
    // message is not enumerable so we need to add it manually
    message: error.message,
  };

  if (error.name) {
    // the string id of a simple error message
    const simpleTranslationStringId = `errors.${error.name}.${field}`;
    let translation = t(simpleTranslationStringId, arg);

    if (translation !== simpleTranslationStringId) {
      if (typeof translation === "object" && "productName" in arg) {
        // it has specific translation for different device and platform
        const platform = Platform.OS;
        const device = arg.productName!.includes("Nano S") ? "nanoS" : "nanoX";

        if (platform === "ios" && device === "nanoS") {
          /**
           * this case should not happen since you can't nativelly connect a Nano S to an iOS device
           * (but you can in local/dev by using a proxy with the simulator)
           */
          return <Text>{t(`errors.generic.${field}`, arg)}</Text>;
        }

        // the string id of a detailled (os and device specific) error message
        const detailedTranslationStringId = `errors.${error.name}.${field}.${platform}.${device}`;
        translation = t(detailedTranslationStringId, arg);

        if (translation !== detailedTranslationStringId) {
          return <Text>{translation}</Text>;
        }
      } else if (typeof translation === "string") {
        return (
          <Text>
            <Trans i18nKey={simpleTranslationStringId} components={{ ...links }} values={arg} />
          </Text>
        );
      }
    }
  }

  return <Text>{t(`errors.generic.${field}`, arg)}</Text>;
}
