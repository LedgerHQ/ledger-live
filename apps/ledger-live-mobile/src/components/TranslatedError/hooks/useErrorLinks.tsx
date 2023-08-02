import React, { useCallback, useMemo } from "react";
import { Linking, Text } from "react-native";

export function useErrorLinks(error?: Error | null) {
  const onErrorLinkPress = useCallback(async (errorLink: string) => {
    if (errorLink.startsWith("http")) {
      const canOpenURL = await Linking.canOpenURL(errorLink);

      if (canOpenURL) {
        Linking.openURL(errorLink);
        return;
      }
    }

    if (errorLink === "/platform/multibuy") {
      Linking.openURL(`ledgerlive:/${errorLink}`);
      return;
    }
  }, []);

  return useMemo(() => {
    if (!!error && "links" in error && Array.isArray(error.links)) {
      const safeStringLinks = error.links
        .filter((link): link is string => typeof link === "string")
        .map(link => link);

      return safeStringLinks.reduce((prev, curr, index) => {
        return {
          ...prev,
          [`link${index}`]: (
            <Text
              style={{ textDecorationLine: "underline" }}
              onPress={() => onErrorLinkPress(curr)}
            />
          ),
        };
      }, {});
    }

    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);
}
