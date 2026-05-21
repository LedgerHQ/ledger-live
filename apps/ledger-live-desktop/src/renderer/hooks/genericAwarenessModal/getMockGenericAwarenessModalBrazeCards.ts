import {
  FeatureIntroRole,
  GenericAwarenessModalLayout,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalInputExtras,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { LocationContentCard, Platform } from "~/types/dynamicContent";

/** Public CDN URLs used in Ledger Shop / Live (verified HTTP 200). */
const MOCK_IMAGES = {
  ledgerFlex1: "https://cdn.shopify.com/s/files/1/2974/4858/files/carrousel_flex_graphite_1_4.webp",
  ledgerFlex2: "https://cdn.shopify.com/s/files/1/2974/4858/files/carrousel_flex_graphite_2_2.webp",
  ledgerFlex3: "https://cdn.shopify.com/s/files/1/2974/4858/files/carrousel_flex_graphite_3.webp",
  ledgerFlexBtc:
    "https://cdn.shopify.com/s/files/1/2974/4858/files/carrousel_flex_btc_1_fb3100cf-76fc-4d13-badf-48753365bb77.webp",
  ledgerCard: "https://cdn.shopify.com/s/files/1/2974/4858/files/card.webp",
  bitcoin: "https://proxycgassets.api.live.ledger.com/coins/images/1/large/bitcoin.png",
  ethereum: "https://proxycgassets.api.live.ledger.com/coins/images/279/large/ethereum.png",
} as const;

const makeMockBrazeCard = (
  id: string,
  extras: GenericAwarenessModalInputExtras,
): GenericAwarenessModalBrazeCard => ({
  id,
  extras: {
    platform: Platform.Desktop,
    location: LocationContentCard.GenericAwarenessModal,
    ...extras,
  },
});

type FeatureIntroItem = {
  icon: string;
  title: string;
  subtitle: string;
};

const makeFeatureIntroCampaign = (
  campaignId: string,
  main: {
    title: string;
    subtitle: string;
    imageUrl?: string;
    primaryButtonLabel: string;
    primaryButtonLink: string;
    secondaryButtonLabel: string;
    secondaryButtonLink: string;
  },
  items: FeatureIntroItem[],
): GenericAwarenessModalBrazeCard[] => [
    makeMockBrazeCard(`mock-${campaignId}-main`, {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId,
      role: FeatureIntroRole.Main,
      imageUrl: main.imageUrl ?? "",
      ...main,
    }),
    ...items.map((item, index) =>
      makeMockBrazeCard(`mock-${campaignId}-item-${index}`, {
        layout: GenericAwarenessModalLayout.FeatureIntro,
        campaignId,
        role: FeatureIntroRole.Item,
        index: String(index),
        icon: item.icon,
        title: item.title,
        subtitle: item.subtitle,
      }),
    ),
  ];

type CarouselSlide = {
  title: string;
  subtitle: string;
  imageUrl: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
};

const makeCarouselCampaign = (
  campaignId: string,
  slides: CarouselSlide[],
): GenericAwarenessModalBrazeCard[] =>
  slides.map((slide, index) =>
    makeMockBrazeCard(`mock-${campaignId}-slide-${index}`, {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId,
      index: String(index),
      ...slide,
    }),
  );

/**
 * Local mock Braze cards until Generic Awareness Modal content is configured in Braze.
 * Extras match {@link GenericAwarenessModalInputSchema} in live-common.
 */
export const getMockGenericAwarenessModalBrazeCards = (): GenericAwarenessModalBrazeCard[] => [
  // APP_START — default when opening the modal without a campaign id (feature intro)
  ...makeFeatureIntroCampaign(
    "APP_START_intro",
    {
      title: "Connect a Ledger device",
      subtitle:
        "Go beyond exchanges and software wallets. Pair a signer to unlock the full Ledger Wallet experience.",
      imageUrl: MOCK_IMAGES.ledgerCard,
      primaryButtonLabel: "Got it",
      primaryButtonLink: "https://www.ledger.com",
      secondaryButtonLabel: "Compare signers",
      secondaryButtonLink: "https://www.ledger.com/compare-ledger-signers",
    },
    [
      {
        icon: "HandCoins",
        title: "Buy, swap, and stake",
        subtitle: "Build your portfolio with the simplicity of exchanges and security of a signer.",
      },
      {
        icon: "Shield",
        title: "Keys stay offline",
        subtitle: "Your private keys never leave your hardware — not even Ledger can access them.",
      },
    ],
  ),

  // Feature intro — open via deeplink with campaign id `1`
  ...makeFeatureIntroCampaign(
    "1",
    {
      title: "Not your keys, not your coins",
      subtitle:
        "Hot wallets and exchanges are convenient, but only a hardware signer gives you true ownership of your crypto.",
      imageUrl: MOCK_IMAGES.ledgerFlex3,
      primaryButtonLabel: "Learn about cold storage",
      primaryButtonLink:
        "https://www.ledger.com/academy/topics/ledgersolutions/what-is-a-cold-wallet",
      secondaryButtonLabel: "Maybe later",
      secondaryButtonLink: "https://www.ledger.com",
    },
    [
      {
        icon: "Lock",
        title: "Offline by design",
        subtitle:
          "Ledger signers store private keys in a Secure Element chip, away from online threats.",
      },
      {
        icon: "Key",
        title: "You hold the keys",
        subtitle:
          "If an exchange pauses withdrawals, assets on your signer remain under your control.",
      },
    ],
  ),

  // Carousel — open via deeplink with campaign id `2`
  ...makeCarouselCampaign("2", [
    {
      title: "Ledger Flex",
      subtitle: "The new standard to buy, swap, stake, and build your portfolio with ease.",
      imageUrl: MOCK_IMAGES.ledgerFlex1,
      primaryButtonLabel: "Discover Flex",
      primaryButtonLink: "https://www.ledger.com/products/ledger-flex",
    },
    {
      title: "Ledger Wallet clarity",
      subtitle: "Faster trades with real-time market and portfolio insights.",
      imageUrl: MOCK_IMAGES.ledgerFlex2,
      primaryButtonLabel: "Explore the app",
      primaryButtonLink: "https://www.ledger.com/ledger-wallet",
    },
    {
      title: "Bitcoin, secured",
      subtitle: "Manage Bitcoin with keys that never leave your device.",
      imageUrl: MOCK_IMAGES.bitcoin,
      primaryButtonLabel: "Bitcoin wallet",
      primaryButtonLink: "https://www.ledger.com/coin/wallet/bitcoin",
    },
    {
      title: "Ethereum & beyond",
      subtitle: "Secure ETH and explore DeFi across Ethereum and L2 networks.",
      imageUrl: MOCK_IMAGES.ethereum,
      primaryButtonLabel: "Ethereum wallet",
      primaryButtonLink: "https://www.ledger.com/coin/wallet/ethereum",
    },
  ]),
];
