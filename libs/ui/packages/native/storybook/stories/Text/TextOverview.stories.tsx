import React from "react";
import { ScrollView } from "react-native";
import { FontWeightTypes } from "src/components/Text/getTextStyle";
import { Flex } from "../../../src/components/Layout";
import Text from "../../../src/components/Text";
import { TextVariants } from "../../../src/styles/theme";
import { storiesOf } from "../storiesOf";

const headerVariants: TextVariants[] = ["h1", "h2", "h3", "h4", "h5"];

const mainVariants: TextVariants[] = [
  "large",
  "body",
  "bodyLineHeight",
  "paragraph",
  "paragraphLineHeight",
  "small",
  "tiny",
];

const subtitleVariants: TextVariants[] = ["subtitle"];

const variants: TextVariants[] = [...headerVariants, ...mainVariants, ...subtitleVariants];

const makeIsInCategory = (variantsArray: TextVariants[]) => (variant: TextVariants) =>
  variantsArray.includes(variant);
const isHeader = makeIsInCategory(headerVariants);
const isSubtitle = makeIsInCategory(subtitleVariants);

const mainFontWeights: FontWeightTypes[] = ["medium", "semiBold", "bold"];

const Overview = () => {
  return (
    <ScrollView horizontal contentContainerStyle={{ padding: 20 }}>
      <ScrollView>
        <Flex flexDirection="column">
          {variants.map((variant) => {
            const fontWeightsToShow: FontWeightTypes[] = isHeader(variant)
              ? ["medium"]
              : isSubtitle(variant)
              ? ["semiBold"]
              : mainFontWeights;
            const decorationsToShow: ("none" | "underline")[] =
              isHeader(variant) || isSubtitle(variant) ? ["none"] : ["none", "underline"];
            return (
              <Flex flexDirection="row" mb={8}>
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
                    <Flex maxWidth={270} mx={4}>
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
    </ScrollView>
  );
};

storiesOf((story) => story("Text", module).add("Overview", Overview));
