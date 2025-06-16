import React from "react";
import { Flex, Text, Link } from "@ledgerhq/native-ui";
import { Linking } from "react-native";

type HeaderProps = {
  title?: string;
  description?: string;
  cta?: string;
  link?: string;
  centered?: boolean;
};

const Header = ({ title, description, cta, link, centered = false }: HeaderProps) => {
  if (!title && !description && !cta && !link) return null;

  const onLinkPress = () => {
    if (link) {
      Linking.canOpenURL(link).then(() => Linking.openURL(link));
    }
  };

  return (
    <Flex mx={6} mb={6}>
      {title || (link && cta) ? (
        <Flex flexDirection="row" justifyContent={centered ? "center" : "space-between"}>
          <Text variant="h5" fontWeight="semiBold" numberOfLines={1}>
            {title}
          </Text>
          {link && cta && !centered ? (
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
          textAlign={centered ? "center" : "left"}
          mt={title || cta ? 1 : 0}
        >
          {description.replace(/\\n/g, "\n")}
        </Text>
      ) : null}
    </Flex>
  );
};

export default Header;
