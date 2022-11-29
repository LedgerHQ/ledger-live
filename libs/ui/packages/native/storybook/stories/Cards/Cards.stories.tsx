import { storiesOf } from "../storiesOf";
import React from "react";
import CardA from "../../../src/components/Cards/CardA";
import CardB from "../../../src/components/Cards/CardB";
import Flex from "../../../src/components/Layout/Flex";
import { text, select, number } from "@storybook/addon-knobs";
import { descriptionCardA, descriptionCardB } from "./descriptionsCards";

const CardAStory = () => {
  const variant = select("variant", ["purple", "red"], undefined);
  const tag = text("tag", "Promo");
  const description = text(
    "description",
    "Lorem <bold>ipsum</bold> dolor sit amet, consectetur adipiscing elit.",
  );
  const backgroundImage = select(
    "backgroundImage",
    [
      undefined,
      "https://s3-alpha-sig.figma.com/img/df7c/53b7/2679f94478199a91b60d7f3e2361b8a2?Expires=1670198400&Signature=fh6Xjo-0E0QS~Huu2M8EOZrB9EawLdDVJt6pTjMkkfH1teHlpMqIH0JiLLEcSB3Wvbpmgz6E7S9QTs3VDJC6UhXRGPFWkG6M1X0lA81tdyrTO4BUULqPs5p2AWkCMpeUsLLOvnVJWVd99YX3E6KBS1cJUEiopA9XtTBpjgoWdK3Ak0IiGrNhLgK0mjbDOyGdgr6uX~VtIi8wxNPTM7ChdmPhbgdQa0yGUaLuzauz2ElFsmsCthUVoJiWu0SNwLYgLrEhUzGkPuhc0CUGr2vW0rwUkh6Bxkcg3SDM8KTO7DvLN5aJzH1tPiODg6E1ctAq4m2xG5DrGNuZiZ26IzsnHA__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
      "https://s3-alpha-sig.figma.com/img/7ae9/069b/84ed6b82b6d39863af0c6ff4f5020d7e?Expires=1670198400&Signature=brIgdYDd5PL1Oe-2q9u6Lg6kfGIprIfVCGlO9m26Hb7Z7fMWBqS6suWJlBdVmy9~LfYKRCBB3A7582k-LiE44hvxuRT1d4jVK2aTzRi~YgevgSrwg49Xkkq2Z8gxM8yzu2Zdni2xdjuRAa3la~INZya44fEDnXl1g0F-uApXLFnwbXB43ZvDWXptxmryoiLoDY~Ngg40KoOBuhldgjRWSSo~hhgRITaURu0dtEQ4~Sqd7X4YPrA9XSdwovwMi-vrSplg8071aWQwJl-Lxoq4WF1ZLKmzmVQohzqqVQ43kfpeKk9bUfhr5MtnZ-z6hRdQ4J2Xuvfr5X-OLOIbAg93-Q__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
    ],
    undefined,
  );

  return (
    <Flex width="500px" height="500px" bg="#fff" alignItems="center" justifyContent="center">
      <Flex width="320px">
        <CardA
          variant={variant}
          backgroundImage={backgroundImage?.replace(/&amp;/g, "&")}
          tag={tag}
          description={description}
        />
      </Flex>
    </Flex>
  );
};

const CardBStory = () => {
  const width = number("Container Width", 350);
  const tag = text("tag", "Promo");
  const title = text(
    "title",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam tellus risus, pretium a nulla sit amet, porta sollicitudin tortor.",
  );
  const cta = text("cta", "My cta action");
  const imageUrl = select(
    "url Image",
    [
      "",
      "https://www.cointribune.com/app/uploads/2020/12/LEDGER-Nano-X.jpg?nowebp",
      "https://cdn.shopify.com/s/files/1/2974/4858/products/01_6.png?v=1647271638",
      "https://media.wired.com/photos/630916d9ba2a66af641b11ee/master/pass/Ledger-Nano-X-Gear.jpg",
    ],
    "",
  );

  return (
    <Flex
      backgroundColor={"primary.c70"}
      height={300}
      width={width}
      alignItems="center"
      justifyContent={"center"}
      p={"16px"}
    >
      <CardB
        tag={tag}
        title={title}
        cta={cta}
        imageUrl={imageUrl}
        onPress={() => {}}
        onPressDismiss={() => {}}
      />
    </Flex>
  );
};

storiesOf((story) =>
  story("Cards", module)
    .add("Card A", CardAStory, {
      docs: {
        title: "Card A",
        description: {
          component: descriptionCardA,
        },
      },
    })
    .add("Card B", CardBStory, {
      docs: {
        title: "Card B",
        description: {
          component: descriptionCardB,
        },
      },
    }),
);
