import React from "react";
import Text, { TextProps } from "./index";
import Flex from "../../layout/Flex";
import { TextVariants } from "../../../styles/theme";

const headerVariants: TextVariants[] = ["h1", "h2", "h3", "h4", "h5"];

const mainVariants: TextVariants[] = [
  "large",
  "largeLineHeight",
  "body",
  "bodyLineHeight",
  "paragraph",
  "paragraphLineHeight",
  "small",
  "extraSmall",
  "tiny",
  "micro",
];

const subtitleVariants: TextVariants[] = ["subtitle"];

const variants: TextVariants[] = [...headerVariants, ...mainVariants, ...subtitleVariants];

const makeIsInCategory = (variantsArray: TextVariants[]) => (variant: TextVariants) =>
  variantsArray.includes(variant);
const isHeader = makeIsInCategory(headerVariants);
const isSubtitle = makeIsInCategory(subtitleVariants);

const mainFontWeights = ["medium", "semiBold", "bold"];

const fontWeights = [undefined, "extraLight", "light", "regular", ...mainFontWeights, "extraBold"];

export default {
  title: "Asorted/Typography/Text",
  component: Text,
  parameters: { actions: { argTypesRegex: false } },
  argTypes: {
    variant: {
      options: [undefined, ...variants],
      control: {
        type: "radio",
      },
    },
    fontWeight: {
      options: [undefined, ...fontWeights],
      control: {
        type: "radio",
      },
    },
    content: {
      type: "text",
    },
  },
};

export const Overview = (() => {
  return (
    <Flex flexDirection="column">
      {variants.map((variant) => {
        const fontWeightsToShow: string[] = isHeader(variant)
          ? ["medium"]
          : isSubtitle(variant)
          ? ["semiBold"]
          : mainFontWeights;
        const decorationsToShow: string[] =
          isHeader(variant) || isSubtitle(variant) ? ["none"] : ["none", "underline"];
        return (
          <Flex flexDirection="row" columnGap={8} mb={8}>
            <div style={{ minWidth: 250 }}>
              <Text variant="small" color="neutral.c90">
                variant="{variant}"
              </Text>
              <br />
              <Text variant="tiny" color="neutral.c70">
                fontWeights: {JSON.stringify(fontWeightsToShow)}
              </Text>
            </div>
            {fontWeightsToShow.flatMap((fontWeight) =>
              decorationsToShow.map((textDecorationLine) => (
                <div style={{ flex: 1 }}>
                  <Text variant={variant} fontWeight={fontWeight} style={{ textDecorationLine }}>
                    Lend stablecoins to the Compound protocol...
                  </Text>
                </div>
              )),
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}).bind({});

const Template = (args: TextProps & { content: string }) => <Text {...args}>{args.content}</Text>;

export const Default = Template.bind({});
// @ts-expect-error FIXME
Default.args = {
  type: "h1",
  content: "Lend stablecoins to the Compound protocol...",
};
