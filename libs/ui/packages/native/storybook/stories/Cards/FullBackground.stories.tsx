import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react-native";
import FullBackgroundCard from "../../../src/components/Cards/FullBackgroundCard";
import Flex from "../../../src/components/Layout/Flex";
import { descriptionFullBackgroundCard } from "./descriptionsCards";

export default {
  title: "Cards",
  component: FullBackgroundCard,
  parameters: {
    docs: {
      description: {
        component: descriptionFullBackgroundCard,
      },
    },
  },
} as ComponentMeta<typeof FullBackgroundCard>;

export const FullBackgroundCardStory: ComponentStory<typeof FullBackgroundCard> = (
  args: typeof FullBackgroundCardStoryArgs,
) => {
  return (
    <Flex
      width="500px"
      height="500px"
      bg="background.main"
      alignItems="center"
      justifyContent="center"
    >
      <Flex width="320px">
        <FullBackgroundCard
          variant={args.variant}
          backgroundImage={args.backgroundImage?.replace(/&amp;/g, "&")}
          tag={args.tag}
          description={args.description}
        />
      </Flex>
    </Flex>
  );
};
FullBackgroundCardStory.storyName = "FullBackgroundCard";
const FullBackgroundCardStoryArgs = {
  variant: undefined,
  tag: "Promo",
  description: "Lorem <bold>ipsum</bold> dolor sit amet, consectetur adipiscing elit.",
  backgroundImage: undefined as string | undefined,
};
FullBackgroundCardStory.args = FullBackgroundCardStoryArgs;
FullBackgroundCardStory.argTypes = {
  variant: {
    options: ["purple", "red"],
  },
  backgroundImage: {
    options: [
      undefined,
      "https://s3-alpha-sig.figma.com/img/df7c/53b7/2679f94478199a91b60d7f3e2361b8a2?Expires=1670198400&Signature=fh6Xjo-0E0QS~Huu2M8EOZrB9EawLdDVJt6pTjMkkfH1teHlpMqIH0JiLLEcSB3Wvbpmgz6E7S9QTs3VDJC6UhXRGPFWkG6M1X0lA81tdyrTO4BUULqPs5p2AWkCMpeUsLLOvnVJWVd99YX3E6KBS1cJUEiopA9XtTBpjgoWdK3Ak0IiGrNhLgK0mjbDOyGdgr6uX~VtIi8wxNPTM7ChdmPhbgdQa0yGUaLuzauz2ElFsmsCthUVoJiWu0SNwLYgLrEhUzGkPuhc0CUGr2vW0rwUkh6Bxkcg3SDM8KTO7DvLN5aJzH1tPiODg6E1ctAq4m2xG5DrGNuZiZ26IzsnHA__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
      "https://s3-alpha-sig.figma.com/img/7ae9/069b/84ed6b82b6d39863af0c6ff4f5020d7e?Expires=1670198400&Signature=brIgdYDd5PL1Oe-2q9u6Lg6kfGIprIfVCGlO9m26Hb7Z7fMWBqS6suWJlBdVmy9~LfYKRCBB3A7582k-LiE44hvxuRT1d4jVK2aTzRi~YgevgSrwg49Xkkq2Z8gxM8yzu2Zdni2xdjuRAa3la~INZya44fEDnXl1g0F-uApXLFnwbXB43ZvDWXptxmryoiLoDY~Ngg40KoOBuhldgjRWSSo~hhgRITaURu0dtEQ4~Sqd7X4YPrA9XSdwovwMi-vrSplg8071aWQwJl-Lxoq4WF1ZLKmzmVQohzqqVQ43kfpeKk9bUfhr5MtnZ-z6hRdQ4J2Xuvfr5X-OLOIbAg93-Q__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
    ],
  },
};
