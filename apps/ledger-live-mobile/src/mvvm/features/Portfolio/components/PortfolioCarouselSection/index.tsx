import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
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
  const { shouldDisplayOperationsList } = useWalletFeaturesConfig("mobile");

  /** Tx History in header: this section is last — safe area + s24 below cards (section only mounts when cards exist). */
  const carouselBottomPadding = shouldDisplayOperationsList ? bottom + 24 : undefined;

  const styles = useStyleSheet(
    theme => ({
      container: {
        backgroundColor,
        ...(carouselBottomPadding === undefined ? {} : { paddingBottom: carouselBottomPadding }),
      },
    }),
    [backgroundColor, carouselBottomPadding],
  );

  return (
    <Box
      style={styles.container}
      lx={{
        paddingTop: "s32",
        ...(carouselBottomPadding === undefined ? { paddingBottom: "s24" } : {}),
      }}
    >
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s12", marginHorizontal: "s16" }}>
          <SubheaderTitle>{t("portfolio.carousel.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Carousel />
    </Box>
  );
};
