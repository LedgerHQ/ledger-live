import type { GenericAwarenessModalData } from "./types";

export const carouselMockData: GenericAwarenessModalData = {
  id: "carousel",
  layout: "carousel",
  content: [
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonAction: "next",
      primaryButtonLabel: "Continue",
      primaryButtonLink: "",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonAction: "next",
      primaryButtonLabel: "Continue",
      primaryButtonLink: "",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonAction: "next",
      primaryButtonLabel: "Continue",
      primaryButtonLink: "",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonAction: "dismiss",
      primaryButtonLabel: "Close",
      primaryButtonLink: "",
    },
  ],
};

export const featureIntroMockData: GenericAwarenessModalData = {
  id: "featureIntro",
  layout: "featureIntro",
  content: {
    imageUrl: "https://picsum.photos/640/360",
    title: "Connect a Ledger device",
    description: "To unlock the full potential of your Ledger Wallet, connect a Ledger device.",
    primaryButtonAction: "dismiss",
    primaryButtonLabel: "Connect",
    primaryButtonLink: "",
    secondaryButtonAction: "dismiss",
    secondaryButtonLabel: "Buy your Ledger device",
    secondaryButtonLink: "",
    items: [
      {
        icon: "HandCoins",
        title: "Full ownership",
        description: "Your private keys never leave the device.",
      },
      {
        icon: "ShieldLock",
        title: "Trade securely",
        description: "Verify transactions on a secure screen.",
      },
      {
        icon: "Wallet",
        title: "Access the most powerful wallet",
        description: "Manage thousands of assets in one place.",
      },
    ],
  },
};
