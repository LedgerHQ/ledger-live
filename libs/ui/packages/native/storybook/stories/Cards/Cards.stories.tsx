import { storiesOf } from "../storiesOf";
import React from "react";
import CardA from "../../../src/components/Cards/CardA";
import CardB from "../../../src/components/Cards/CardB";
import InformativeCard from "../../../src/components/Cards/InformativeCard";
import Flex from "../../../src/components/Layout/Flex";
import { text, select, number } from "@storybook/addon-knobs";
import { descriptionCardA, descriptionCardB, descriptionCardD } from "./descriptionsCards";

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

const CardDStory = () => {
  const tag = text("tag", "Promo");
  const title = text(
    "title",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam tellus risus, pretium a nulla sit amet, porta sollicitudin tortor.",
  );

  const imageUrl = select(
    "url Image",
    [
      "https://s3-alpha-sig.figma.com/img/c612/0964/8542620853157378d404f6a35813545b?Expires=1671408000&Signature=TmzxWg0esXtZh5wr1vGqx9zTirE~TNxSli119uSj7PREAAYyj-B1LBMSwy33hORgayqNY4dCdSTCM7nYPRo0scgVJgXfUM1EawnSwOrQtvTO6Il~QGhhTmIAxtrcE2tWiSpwToQYZBpCk2hzIoB5GkLxMvrfDwzBHx8bR1UWeFskRu0QeMfbbww2~7tBL6w4de~D6PCd5zh9dEw-TL~vyhO43~KJMJBUVqk5zjbqI~SYkf-rXff-5T~59o3avSVapsWuleTem02XPShdvH8-FIS1BVQce-WIry59bdVy7WQpniLJYffeSpOqKXb5pQw6zRioJjBHBr-Cn~eftv4c7A__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
      "https://s3-alpha-sig.figma.com/img/0f07/c648/73ebeffc083aac935ae4fe33f6f8fd05?Expires=1671408000&Signature=Ctq2rZ5Bh2eDORA1Oz2c4WW94X-gn8tGBsRo2xP2TnRwPjJDTdK05F-nEfqtlelwI9KLLAV3LID3phu0k9tca1bUVreirf2tBrwZ4ZePtg5z3fHsGllelCsd9B2TQGioNpS~8Zskx4LUoP6SvRsLbIAuFnhfPQLTuM02sCjxfE5sLefDqTNF4L8hH0rFr46t--zibS~UAJCZAsP0i3FzIGgEroRrRdtCl7VvuL40oLT-wQhca-4K6-~VYk9vs07hfsNCeCivZQmeFX1ZhDFE0ADapBW8S~PKWc8KaKMoHBRE~CdZFt7y6m-Uc3lIB1xFWk-zto1SzVzfvHC~ucZyGw__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
      "https://s3-alpha-sig.figma.com/img/7c7b/64c2/62088b7b9e550eea12208a501fd9d57d?Expires=1671408000&Signature=KV8ZedhcFA1oh8gntmHo3j9gtsg1kgJcpbIWDutlJ3dyewDi2fCocWBzHZoMiFfeZSQyIcnRPYJI5hxtcVy-48naoBrmTyxw7QCokAK0LZ4-Ts3h8LAPRMFd4E4-6q3Gp9vDdkIoct89BeXBFPmuLAAZ5dfGOoKU~sKLbw1KZhDHlRqFBlzaKwkbEljHD5~DmLLAmprbkG~2u1kbEPH7X4Jd0yrH16-PEhF6zN7o2yESbtN~~uhq--kFtCBXZbv~67g0JZdzh6t7cO-vzH3qxCYYzE5NTPQTgZdlkmIvh9DFsdJjHcO5wlAMlvm0SijPIqYmbdLGGU6hGj-99KL-fw__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
    ],
    "",
  );

  return (
    <Flex
      backgroundColor={"primary.c20"}
      height={300}
      width={400}
      alignItems="center"
      justifyContent={"center"}
      p={"16px"}
    >
      <InformativeCard tag={tag} title={title} imageUrl={imageUrl?.replace(/&amp;/g, "&")} />
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
    })
    .add("Card D", CardDStory, {
      docs: {
        title: "Card D",
        description: {
          component: descriptionCardD,
        },
      },
    }),
);
