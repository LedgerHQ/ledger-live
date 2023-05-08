import React from "react";
import { ScrollView } from "react-native";
import proxyStyled from "../../../src/components/styled";
import { fontWeightTypes, FontWeightTypes } from "../../../src/components/Text/getTextStyle";
import { Flex } from "../../../src/components/Layout";
import Text from "../../../src/components/Text";
import { textVariants, TextVariants } from "../../../src/styles/theme";

export default {
  title: "Text/Overview",
  component: Text,
};

const HorizontalScroll = proxyStyled(ScrollView).attrs({
  horizontal: true,
  flex: 1,
  width: "100%",
})``;

const headerVariants: TextVariants[] = ["h1", "h1Inter", "h2", "h3", "h4", "h5"];
const headerInterVariants: TextVariants[] = ["h1Inter", "h4", "h5"];
const subtitleVariants: TextVariants[] = ["subtitle"];

const makeIsInCategory = (variantsArray: TextVariants[]) => (variant: TextVariants) =>
  variantsArray.includes(variant);
const isHeader = makeIsInCategory(headerVariants);
const isSubtitle = makeIsInCategory(subtitleVariants);
const isHeaderInter = makeIsInCategory(headerInterVariants);

export const Overview = () => {
  return (
    <HorizontalScroll>
      <ScrollView>
        <Flex flexDirection="column" padding={7}>
          {textVariants.map((variant) => {
            const fontWeightsToShow: FontWeightTypes[] =
              isHeader(variant) && !isHeaderInter(variant)
                ? ["medium"]
                : isSubtitle(variant)
                ? ["semiBold"]
                : fontWeightTypes;
            const decorationsToShow: ("none" | "underline")[] =
              isHeader(variant) || isSubtitle(variant) ? ["none"] : ["none", "underline"];
            return (
              <Flex key={variant} flexDirection="row" mb={8}>
                <Flex style={{ minWidth: 250 }}>
                  <Text variant="small" mt={6} color="neutral.c90">
                    variant="{variant}"
                  </Text>
                  <Text variant="tiny" color="neutral.c70">
                    fontWeights: {JSON.stringify(fontWeightsToShow)}
                  </Text>
                </Flex>
                {fontWeightsToShow.flatMap((fontWeight) =>
                  decorationsToShow.map((textDecorationLine) => (
                    <Flex key={fontWeight + textDecorationLine} maxWidth={270} mx={4}>
                      <Text
                        variant={variant}
                        fontWeight={fontWeight}
                        style={{ textDecorationLine }}
                      >
                        Lend stablecoins to the Compound protocol...
                      </Text>
                    </Flex>
                  )),
                )}
              </Flex>
            );
          })}
        </Flex>
      </ScrollView>
    </HorizontalScroll>
  );
};
