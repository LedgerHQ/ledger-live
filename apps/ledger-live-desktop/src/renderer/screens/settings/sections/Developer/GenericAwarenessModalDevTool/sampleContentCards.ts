import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { DEV_CAMPAIGN_IDS } from "./campaignIds";
import { getPicsumCarouselImageUrl, getPicsumImageUrl } from "./placeholderImages";

const sampleCarouselSlides = [
  {
    title: "Ledger Flex",
    subtitle: "The new standard to buy, swap, stake, and build your portfolio with ease.",
    imageUrl: getPicsumCarouselImageUrl(0),
    primaryButtonLabel: "Discover Flex",
    primaryButtonLink: "https://www.ledger.com/products/ledger-flex",
  },
  {
    title: "Ledger Wallet clarity",
    subtitle: "Faster trades with real-time market and portfolio insights.",
    imageUrl: getPicsumCarouselImageUrl(1),
    primaryButtonLabel: "Explore the app",
    primaryButtonLink: "https://www.ledger.com/ledger-wallet",
  },
  {
    title: "Bitcoin, secured",
    subtitle: "Manage Bitcoin with keys that never leave your device.",
    imageUrl: getPicsumCarouselImageUrl(2),
    primaryButtonLabel: "Bitcoin wallet",
    primaryButtonLink: "https://www.ledger.com/coin/wallet/bitcoin",
  },
];

/** Sample cards aligned with dev tool campaign ids and carousel Continue / Close behavior. */
export const sampleGenericAwarenessModalContentCards: GenericAwarenessModalContentCard[] = [
  {
    layout: GenericAwarenessModalLayout.FeatureIntro,
    id: DEV_CAMPAIGN_IDS.appStartFeatureIntro,
    title: "Connect a Ledger device",
    subtitle:
      "Go beyond exchanges and software wallets. Pair a signer to unlock the full Ledger Wallet experience.",
    imageUrl: getPicsumImageUrl("sample-feature-intro-app-start"),
    primaryButtonLabel: "Got it",
    primaryButtonLink: "https://www.ledger.com",
    secondaryButtonLabel: "Compare signers",
    secondaryButtonLink: "https://www.ledger.com/compare-ledger-signers",
    items: [
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
  },
  {
    layout: GenericAwarenessModalLayout.Carousel,
    id: DEV_CAMPAIGN_IDS.appStartCarousel,
    data: sampleCarouselSlides,
  },
  {
    layout: GenericAwarenessModalLayout.FeatureIntro,
    id: DEV_CAMPAIGN_IDS.bannerFeatureIntro,
    title: "Not your keys, not your coins",
    subtitle:
      "Hot wallets and exchanges are convenient, but only a hardware signer gives you true ownership of your crypto.",
    imageUrl: getPicsumImageUrl("sample-feature-intro-banner"),
    primaryButtonLabel: "Learn about cold storage",
    primaryButtonLink:
      "https://www.ledger.com/academy/topics/ledgersolutions/what-is-a-cold-wallet",
    secondaryButtonLabel: "Maybe later",
    secondaryButtonLink: "https://www.ledger.com",
    items: [
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
  },
  {
    layout: GenericAwarenessModalLayout.Carousel,
    id: DEV_CAMPAIGN_IDS.bannerCarousel,
    data: sampleCarouselSlides,
  },
];
