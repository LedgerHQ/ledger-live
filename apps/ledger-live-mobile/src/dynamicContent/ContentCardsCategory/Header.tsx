import React from "react";
import { Linking } from "react-native";
import { Box, Link, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

type HeaderProps = {
  title?: string;
  description?: string;
  cta?: string;
  link?: string;
  centered?: boolean;
  showCloseAll?: boolean;
  onCloseAll?: () => void;
};

const Header = ({
  title,
  description,
  cta,
  link,
  centered = false,
  showCloseAll = false,
  onCloseAll,
}: HeaderProps) => {
  const { t } = useTranslation();

  if (!title && !description && !cta && !link && !showCloseAll) return null;

  const onLinkPress = () => {
    if (link) {
      Linking.canOpenURL(link).then(() => Linking.openURL(link));
    }
  };

  const showHeaderCta = Boolean(link && cta && !centered && !showCloseAll);

  return (
    <Box lx={{ marginHorizontal: "s16", marginBottom: "s12" }}>
      {title || showHeaderCta || showCloseAll ? (
        <Box
          lx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: centered ? "center" : "space-between",
            gap: "s16",
          }}
        >
          {title ? (
            <Text typography="heading4SemiBold" lx={{ color: "base", flexShrink: 1 }} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {showCloseAll ? (
            <Link
              appearance="base"
              onPress={onCloseAll}
              size="sm"
              testID="hardware-carousel-close-all"
              underline={false}
            >
              {t("portfolio.carousel.closeAll")}
            </Link>
          ) : null}
          {showHeaderCta ? (
            <Link appearance="accent" onPress={onLinkPress} size="sm" underline={false}>
              {cta}
            </Link>
          ) : null}
        </Box>
      ) : null}
      {description ? (
        <Text
          typography="body2"
          lx={{
            color: "muted",
            marginTop: title || showHeaderCta || showCloseAll ? "s4" : undefined,
            textAlign: centered ? "center" : "left",
          }}
          numberOfLines={2}
        >
          {description.replace(/\\n/g, "\n")}
        </Text>
      ) : null}
    </Box>
  );
};

export default Header;
