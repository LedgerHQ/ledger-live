import React from "react";
import { Flex, Text, Link } from "@ledgerhq/native-ui";
import { Linking } from "react-native";

type HeaderProps = {
  title?: string;
  description?: string;
  cta?: string;
  link?: string;
};

const Header = ({ title, description, cta, link }: HeaderProps) => {
  if (!title && !description && !cta && !link) return null;

  const onLinkPress = () => {
    if (link) {
      Linking.canOpenURL(link).then(() => Linking.openURL(link));
    }
  };

  return (
    <Flex mx={6} mb={6}>
      {title || (link && cta) ? (
        <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text
            variant="h5"
            fontWeight="semiBold"
            numberOfLines={1}
            width={link && cta ? "80%" : "100%"}
          >
            {title}
          </Text>
          {link && cta ? (
            <Link size="medium" type="color" onPress={onLinkPress}>
              {cta}
            </Link>
          ) : null}
        </Flex>
      ) : null}
      {description ? (
        <Text
          variant="body"
          fontWeight="medium"
          numberOfLines={2}
          color="neutral.c70"
          mt={title || cta ? 1 : 0}
        >
          {description}
        </Text>
      ) : null}
    </Flex>
  );
};

export default Header;
