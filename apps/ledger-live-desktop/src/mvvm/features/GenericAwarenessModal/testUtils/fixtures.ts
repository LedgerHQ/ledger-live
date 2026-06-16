import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalCarousel,
  type GenericAwarenessModalFeatureIntro,
  type GenericAwarenessModalPrompt,
} from "@ledgerhq/live-common/genericAwarenessModal";

/** APP_START campaign — default when opening the modal without a campaign id. */
export const APP_START_CAMPAIGN_ID = "APP_START_intro";

/** Feature intro campaign — open via deeplink with this campaign id. */
export const FEATURE_INTRO_CAMPAIGN_ID = "1";

/** Carousel campaign — open via deeplink with this campaign id. */
export const CAROUSEL_CAMPAIGN_ID = "2";

/** Prompt campaign — open via deeplink with this campaign id. */
export const PROMPT_CAMPAIGN_ID = "3";

export const appStartFeatureIntroCard: GenericAwarenessModalFeatureIntro = {
  layout: GenericAwarenessModalLayout.FeatureIntro,
  id: APP_START_CAMPAIGN_ID,
  title: "Connect a Ledger device",
  subtitle:
    "Go beyond exchanges and software wallets. Pair a signer to unlock the full Ledger Wallet experience.",
  imageUrlLight: "",
  imageUrlDark: "",
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
};

export const featureIntroCampaignCard: GenericAwarenessModalFeatureIntro = {
  layout: GenericAwarenessModalLayout.FeatureIntro,
  id: FEATURE_INTRO_CAMPAIGN_ID,
  title: "Not your keys, not your coins",
  subtitle:
    "Hot wallets and exchanges are convenient, but only a hardware signer gives you true ownership of your crypto.",
  imageUrlLight: "",
  imageUrlDark: "",
  primaryButtonLabel: "Learn about cold storage",
  primaryButtonLink: "https://www.ledger.com/academy/topics/ledgersolutions/what-is-a-cold-wallet",
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
};

export const carouselCampaignCard: GenericAwarenessModalCarousel = {
  layout: GenericAwarenessModalLayout.Carousel,
  id: CAROUSEL_CAMPAIGN_ID,
  data: [
    {
      title: "Ledger Flex",
      subtitle: "The new standard to buy, swap, stake, and build your portfolio with ease.",
      imageUrlLight: "https://example.com/flex.png",
      imageUrlDark: "",
      primaryButtonLabel: "Discover Flex",
      primaryButtonLink: "https://www.ledger.com/products/ledger-flex",
      navigationButtonLabel: "",
    },
    {
      title: "Ledger Wallet clarity",
      subtitle: "Faster trades with real-time market and portfolio insights.",
      imageUrlLight: "https://example.com/wallet.png",
      imageUrlDark: "",
      primaryButtonLabel: "Explore the app",
      primaryButtonLink: "https://www.ledger.com/ledger-wallet",
      navigationButtonLabel: "",
    },
    {
      title: "Bitcoin, secured",
      subtitle: "Manage Bitcoin with keys that never leave your device.",
      imageUrlLight: "https://example.com/bitcoin.png",
      imageUrlDark: "",
      primaryButtonLabel: "Bitcoin wallet",
      primaryButtonLink: "https://www.ledger.com/coin/wallet/bitcoin",
      navigationButtonLabel: "",
    },
    {
      title: "Ethereum & beyond",
      subtitle: "Secure ETH and explore DeFi across Ethereum and L2 networks.",
      imageUrlLight: "https://example.com/ethereum.png",
      imageUrlDark: "",
      primaryButtonLabel: "Ethereum wallet",
      primaryButtonLink: "https://www.ledger.com/coin/wallet/ethereum",
      navigationButtonLabel: "",
    },
  ],
  isReady: true,
};

export const promptCampaignCard: GenericAwarenessModalPrompt = {
  layout: GenericAwarenessModalLayout.Prompt,
  id: PROMPT_CAMPAIGN_ID,
  title: "Stay in control",
  subtitle: "Move assets to a hardware signer for true self-custody.",
  imageUrlLight: "https://example.com/prompt.png",
  imageUrlDark: "",
  primaryButtonLabel: "Learn more",
  primaryButtonLink: "https://www.ledger.com/academy",
  secondaryButtonLabel: "Maybe later",
  secondaryButtonLink: "https://www.ledger.com",
};

export const genericAwarenessModalTestContentCards = [
  appStartFeatureIntroCard,
  featureIntroCampaignCard,
  carouselCampaignCard,
  promptCampaignCard,
];
