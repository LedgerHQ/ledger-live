import React from "react";
import { Linking } from "react-native";
import { Box, Link, Text } from "@ledgerhq/lumen-ui-rnative";
import { HardwareCarouselCloseAllLink } from "~/dynamicContent/hardwareCarousel/HardwareCarouselCloseAllLink";

type HeaderProps = {
  title?: string;
  description?: string;
  cta?: string;
  link?: string;
  centered?: boolean;
  closeAllCardIds?: readonly string[];
};

function openHeaderLink(link: string): void {
  Linking.canOpenURL(link)
    .then(canOpen => {
      if (canOpen) {
        Linking.openURL(link);
      }
    })
    .catch(() => {
      // Ignore unsupported or malformed URLs.
    });
}

type HeaderTitleRowProps = Readonly<{
  title?: string;
  centered: boolean;
  showCloseAll: boolean;
  closeAllCardIds?: readonly string[];
  showHeaderCta: boolean;
  cta?: string;
  onLinkPress: () => void;
}>;

function HeaderTitleRow({
  title,
  centered,
  showCloseAll,
  closeAllCardIds,
  showHeaderCta,
  cta,
  onLinkPress,
}: HeaderTitleRowProps) {
  return (
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
      {showCloseAll && closeAllCardIds ? (
        <HardwareCarouselCloseAllLink cardIds={closeAllCardIds} />
      ) : null}
      {showHeaderCta ? (
        <Link appearance="accent" onPress={onLinkPress} size="sm" underline={false}>
          {cta}
        </Link>
      ) : null}
    </Box>
  );
}

type HeaderDescriptionProps = Readonly<{
  description: string;
  centered: boolean;
  hasTitleRow: boolean;
}>;

function HeaderDescription({ description, centered, hasTitleRow }: HeaderDescriptionProps) {
  return (
    <Text
      typography="body2"
      lx={{
        color: "muted",
        marginTop: hasTitleRow ? "s4" : undefined,
        textAlign: centered ? "center" : "left",
      }}
      numberOfLines={2}
    >
      {description.replace(/\\n/g, "\n")}
    </Text>
  );
}

const Header = ({
  title,
  description,
  cta,
  link,
  centered = false,
  closeAllCardIds,
}: Readonly<HeaderProps>) => {
  const showCloseAll = Boolean(closeAllCardIds?.length);
  const showHeaderCta = Boolean(link && cta && !centered && !showCloseAll);
  const hasTitleRow = Boolean(title || showHeaderCta || showCloseAll);

  if (!hasTitleRow && !description) {
    return null;
  }

  const onLinkPress = () => {
    if (link) {
      openHeaderLink(link);
    }
  };

  return (
    <Box lx={{ marginHorizontal: "s16", marginBottom: "s12" }}>
      {hasTitleRow ? (
        <HeaderTitleRow
          title={title}
          centered={centered}
          showCloseAll={showCloseAll}
          closeAllCardIds={closeAllCardIds}
          showHeaderCta={showHeaderCta}
          cta={cta}
          onLinkPress={onLinkPress}
        />
      ) : null}
      {description ? (
        <HeaderDescription
          description={description}
          centered={centered}
          hasTitleRow={hasTitleRow}
        />
      ) : null}
    </Box>
  );
};

export default Header;
