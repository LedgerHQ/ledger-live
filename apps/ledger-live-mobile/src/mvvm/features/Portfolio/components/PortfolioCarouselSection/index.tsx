import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import Carousel from "~/components/Carousel";

interface PortfolioCarouselSectionProps {
  readonly backgroundColor: string;
}

export const PortfolioCarouselSection = ({ backgroundColor }: PortfolioCarouselSectionProps) => {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  /** Tx History in header: this section is last — safe area + s24 below cards (section only mounts when cards exist). */
  const carouselBottomPadding = bottom + 24;

  const styles = useStyleSheet(
    () => ({
      container: {
        backgroundColor,
        paddingBottom: carouselBottomPadding,
      },
    }),
    [backgroundColor, carouselBottomPadding],
  );

  return (
    <Box style={styles.container} lx={{ paddingTop: "s32" }}>
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s12", marginHorizontal: "s16" }}>
          <SubheaderTitle>{t("portfolio.carousel.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Carousel />
    </Box>
  );
};
