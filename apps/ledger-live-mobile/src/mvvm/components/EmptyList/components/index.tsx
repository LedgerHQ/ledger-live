import React from "react";
import { Flex, Text, Button, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

type Props = {
  titleKey: string;
  subTitleKey?: string;
  testID?: string;
} & (
  | {
      buttonTextKey: string;
      onButtonPress: () => void;
    }
  | {
      buttonTextKey?: never;
      onButtonPress?: never;
    }
) &
  (
    | {
        linkTextKey: string;
        urlLink: string;
      }
    | {
        linkTextKey?: never;
        urlLink?: never;
      }
  );

const EmptyList: React.FC<Props> = ({
  titleKey,
  subTitleKey,
  buttonTextKey,
  linkTextKey,
  urlLink,
  onButtonPress,
  testID,
}) => {
  const { t } = useTranslation();

  const onLinkPress = (url: string) => Linking.openURL(url);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center" px={6} testID={testID}>
      {!!titleKey && (
        <Text
          textAlign="center"
          variant="h1Inter"
          fontWeight="semiBold"
          color="neutral.c100"
          mb={6}
        >
          {t(titleKey)}
        </Text>
      )}
      {!!subTitleKey && (
        <Text
          textAlign="center"
          variant="bodyLineHeight"
          fontWeight="semiBold"
          color="neutral.c80"
          mb={8}
        >
          {t(subTitleKey)}
        </Text>
      )}
      {!!buttonTextKey && (
        <Button onPress={onButtonPress} size="large" type="main" mb={8}>
          {t(buttonTextKey)}
        </Button>
      )}
      {!!linkTextKey && (
        <Link onPress={() => onLinkPress(urlLink)} size="medium">
          <Text
            fontWeight="semiBold"
            variant="paragraph"
            textAlign="center"
            style={{ textDecorationLine: "underline" }}
          >
            {t(linkTextKey)}
          </Text>
        </Link>
      )}
    </Flex>
  );
};
export default EmptyList;
