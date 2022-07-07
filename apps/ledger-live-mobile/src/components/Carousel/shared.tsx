import React from "react";
import { urls } from "../../config/urls";
import Slide, { SlideProps } from "./Slide";
import Illustration from "../../images/illustration/Illustration";
import { width } from "../../helpers/normalizeSize";
import { ScreenName } from "../../const";

const illustrations = {
  dark: {
    academy: require("../../images/illustration/Dark/_063.png"),
    swap: require("../../images/illustration/Dark/_025.png"),
    familyPack: require("../../images/illustration/Dark/_FamilyPackX.png"),
    familyPackX: require("../../images/illustration/Dark/_FamilyPackX.png"),
    market: require("../../images/illustration/Dark/_Market.png"),
    buy: require("../../images/illustration/Dark/_048.png"),
    lido: require("../../images/illustration/Dark/_Lido.png"),
    discoverWeb3: require("../../images/illustration/Dark/_030.png"),
    card: require("../../images/illustration/Dark/_082.png"),
  },
  light: {
    academy: require("../../images/illustration/Light/_063.png"),
    swap: require("../../images/illustration/Light/_025.png"),
    familyPack: require("../../images/illustration/Light/_FamilyPackX.png"),
    familyPackX: require("../../images/illustration/Light/_FamilyPackX.png"),
    market: require("../../images/illustration/Light/_Market.png"),
    buy: require("../../images/illustration/Light/_048.png"),
    lido: require("../../images/illustration/Light/_Lido.png"),
    discoverWeb3: require("../../images/illustration/Light/_030.png"),
    card: require("../../images/illustration/Light/_082.png"),
  },
};

/*
const AcademySlide: SlideProps = {
  url: urls.banners.ledgerAcademy,
  name: "takeTour",
  title: "carousel.banners.tour.title",
  description: "carousel.banners.tour.description",
  cta: "carousel.banners.tour.cta",
  icon: (
    <Illustration
      lightSource={illustrations.light.academy}
      darkSource={illustrations.dark.academy}
      size={84}
    />
  ),
  position: {
    bottom: 70,
    left: 15,
    width: 146,
    height: 93,
  },
};
*/

const BuySlide: SlideProps = {
  url: "ledgerlive://buy",
  name: "buyCrypto",
  title: "carousel.banners.buyCrypto.title",
  description: "carousel.banners.buyCrypto.description",
  cta: "carousel.banners.buyCrypto.cta",
  icon: (
    <Illustration
      lightSource={illustrations.light.buy}
      darkSource={illustrations.dark.buy}
      size={84}
    />
  ),
  position: {
    bottom: 70,
    left: 0,
    width: 146,
    height: 93,
  },
};

const SwapSlide: SlideProps = {
  url: "ledgerlive://swap",
  name: "Swap",
  title: "carousel.banners.swap.title",
  description: "carousel.banners.swap.description",
  cta: "carousel.banners.swap.cta",
  icon: (
    <Illustration
      lightSource={illustrations.light.swap}
      darkSource={illustrations.dark.swap}
      size={84}
    />
  ),
  position: {
    bottom: 70,
    left: 0,
    width: 127,
    height: 100,
  },
};

const LidoSlide: SlideProps = {
  url: "ledgerlive://discover/lido",
  onPress: navigate => {
    navigate(ScreenName.PlatformApp, {
      platform: "lido",
      name: "Lido",
    });
  },
  name: "Lido",
  title: "carousel.banners.lido.title",
  description: "carousel.banners.lido.description",
  cta: "carousel.banners.lido.cta",
  icon: (
    <Illustration
      lightSource={illustrations.light.lido}
      darkSource={illustrations.dark.lido}
      size={84}
    />
  ),
  position: {
    bottom: 70,
    left: 0,
    width: 127,
    height: 100,
  },
};

const MarketSlide: SlideProps = {
  url: "ledgerlive://market",
  name: "Market",
  title: "carousel.banners.market.title",
  description: "carousel.banners.market.description",
  cta: "carousel.banners.market.cta",
  icon: (
    <Illustration
      lightSource={illustrations.light.market}
      darkSource={illustrations.dark.market}
      size={84}
    />
  ),
  position: {
    bottom: 70,
    left: 0,
    width: 180,
    height: 80,
  },
};

/** 
const FamilyPackSlide: SlideProps = {
  url: urls.banners.familyPack,
  name: "FamilyPack",
  title: "carousel.banners.familyPack.title",
  description: "carousel.banners.familyPack.description",
  cta: "carousel.banners.familyPack.cta",
  icon: (
    <Illustration
      lightSource={illustrations.light.familyPack}
      darkSource={illustrations.dark.familyPack}
      size={84}
    />
  ),
  position: {
    bottom: 70,
    left: 0,
    width: 180,
    height: 80,
  },
};
*/

const FamilyPackXSlide: SlideProps = {
  url: urls.banners.familyPackX,
  name: "FamilyPack",
  title: "carousel.banners.familyPackX.title",
  description: "carousel.banners.familyPackX.description",
  cta: "carousel.banners.familyPackX.cta",
  icon: (
    <Illustration
      lightSource={illustrations.light.familyPackX}
      darkSource={illustrations.dark.familyPackX}
      size={84}
    />
  ),
  position: {
    bottom: 70,
    left: 0,
    width: 180,
    height: 80,
  },
};

const ManageClCardSlide: SlideProps = {
  url: "ledgerlive://discover/cl-card",
  onPress: navigate => {
    navigate(ScreenName.PlatformApp, {
      platform: "cl-card",
      name: "CL Card Powered by Ledger",
    });
  },
  name: "ManageClCard",
  title: "carousel.banners.manageCard.title",
  description: "carousel.banners.manageCard.description",
  cta: "carousel.banners.manageCard.cta",
  icon: (
    <Illustration
      lightSource={illustrations.light.card}
      darkSource={illustrations.dark.card}
      size={84}
    />
  ),
  position: {
    bottom: 70,
    left: 0,
    width: 180,
    height: 80,
  },
};

const ExploreWeb3SlideProps: SlideProps = {
  url: urls.discover.academy,
  name: "DiscoverWeb3",
  title: "carousel.banners.discoverWeb3.title",
  description: "carousel.banners.discoverWeb3.description",
  cta: "carousel.banners.discoverWeb3.cta",
  icon: (
    <Illustration
      lightSource={illustrations.light.discoverWeb3}
      darkSource={illustrations.dark.discoverWeb3}
      size={84}
    />
  ),
  position: {
    bottom: 70,
    left: 0,
    width: 180,
    height: 80,
  },
};

export const SLIDES: SlideProps[] = [
  ManageClCardSlide,
  SwapSlide,
  LidoSlide,
  BuySlide,
  MarketSlide,
  FamilyPackXSlide,
];

export const WIDTH = width * 0.8;

export const ExploreWeb3Slide = () => <Slide {...ExploreWeb3SlideProps} />;

export const getDefaultSlides = () =>
  SLIDES.map(slide => ({
    id: slide.name,
    Component: () => <Slide width={WIDTH} {...slide} />,
  }));
