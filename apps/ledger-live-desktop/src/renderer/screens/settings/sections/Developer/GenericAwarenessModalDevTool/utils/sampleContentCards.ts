import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { DEV_CAMPAIGN_IDS } from "./campaignIds";
import { getDevToolCarouselImageUrl, getDevToolPlaceholderImageUrl } from "./placeholderImages";

const sampleCarouselSlides = [
  {
    title: "Ledger Flex",
    subtitle: "The new standard to buy, swap, stake, and build your portfolio with ease.",
    imageUrl: getDevToolCarouselImageUrl(0),
    primaryButtonLabel: "Discover Flex",
    primaryButtonLink: "https://www.ledger.com/products/ledger-flex",
  },
  {
    title: "Ledger Wallet clarity",
    subtitle: "Faster trades with real-time market and portfolio insights.",
    imageUrl: getDevToolCarouselImageUrl(1),
    primaryButtonLabel: "Explore the app",
    primaryButtonLink: "https://www.ledger.com/ledger-wallet",
  },
  {
    title: "Bitcoin, secured",
    subtitle: "Manage Bitcoin with keys that never leave your device.",
    imageUrl: getDevToolCarouselImageUrl(2),
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
    imageUrl: getDevToolPlaceholderImageUrl("sample-feature-intro-app-start"),
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
    isReady: true,
  },
  {
    layout: GenericAwarenessModalLayout.Carousel,
    id: DEV_CAMPAIGN_IDS.appStartCarousel,
    data: sampleCarouselSlides,
    isReady: true,
  },
  {
    layout: GenericAwarenessModalLayout.FeatureIntro,
    id: DEV_CAMPAIGN_IDS.bannerFeatureIntro,
    title: "Not your keys, not your coins",
    subtitle:
      "Hot wallets and exchanges are convenient, but only a hardware signer gives you true ownership of your crypto.",
    imageUrl: getDevToolPlaceholderImageUrl("sample-feature-intro-banner"),
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
    isReady: true,
  },
  {
    layout: GenericAwarenessModalLayout.Carousel,
    id: DEV_CAMPAIGN_IDS.bannerCarousel,
    data: sampleCarouselSlides,
    isReady: true,
  },
  {
    layout: GenericAwarenessModalLayout.Prompt,
    id: DEV_CAMPAIGN_IDS.appStartPrompt,
    title: "Stay in control",
    subtitle: "Move assets to a hardware signer for true self-custody.",
    imageUrl: getDevToolPlaceholderImageUrl("sample-prompt-app-start"),
    primaryButtonLabel: "Learn more",
    primaryButtonLink: "https://www.ledger.com/academy",
    secondaryButtonLabel: "Maybe later",
    secondaryButtonLink: "https://www.ledger.com",
  },
  {
    layout: GenericAwarenessModalLayout.Prompt,
    id: DEV_CAMPAIGN_IDS.bannerPrompt,
    title: "Secure your assets",
    subtitle: "Hardware signers keep your keys offline and under your control.",
    imageUrl: getDevToolPlaceholderImageUrl("sample-prompt-banner"),
    primaryButtonLabel: "Discover signers",
    primaryButtonLink: "https://www.ledger.com/products",
    secondaryButtonLabel: "Not now",
    secondaryButtonLink: "https://www.ledger.com",
  },
];
