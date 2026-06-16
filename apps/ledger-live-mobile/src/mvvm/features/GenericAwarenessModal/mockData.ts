import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalPrompt,
} from "@ledgerhq/live-common/genericAwarenessModal";

export const carouselWithoutPrimaryLinksMockData: GenericAwarenessModalContentCard = {
  id: "carouselWithoutPrimaryLinks",
  layout: GenericAwarenessModalLayout.Carousel,
  data: [
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "",
      primaryButtonLink: "",
      navigationButtonLabel: "",
    },
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "",
      primaryButtonLink: "",
      navigationButtonLabel: "",
    },
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "",
      primaryButtonLink: "",
      navigationButtonLabel: "",
    },
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "",
      primaryButtonLink: "",
      navigationButtonLabel: "",
    },
  ],
  isReady: true,
};

export const carouselWithPrimaryLinksMockData: GenericAwarenessModalContentCard = {
  id: "carouselWithPrimaryLinks",
  layout: GenericAwarenessModalLayout.Carousel,
  data: [
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "Learn more external",
      primaryButtonLink: "https://www.ledger.com",
      navigationButtonLabel: "",
    },
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "Learn more internal",
      primaryButtonLink: "ledgerlive://earn",
      navigationButtonLabel: "",
    },
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "Learn more external",
      primaryButtonLink: "https://www.ledger.com",
      navigationButtonLabel: "",
    },
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "Learn more internal",
      primaryButtonLink: "ledgerlive://earn",
      navigationButtonLabel: "",
    },
  ],
  isReady: true,
};

export const carouselMockData: GenericAwarenessModalContentCard = {
  id: "carousel",
  layout: GenericAwarenessModalLayout.Carousel,
  data: [
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "Learn more external",
      primaryButtonLink: "https://www.ledger.com",
      navigationButtonLabel: "",
    },
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "Learn more internal",
      primaryButtonLink: "ledgerlive://earn",
      navigationButtonLabel: "",
    },
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "",
      primaryButtonLink: "",
      navigationButtonLabel: "",
    },
    {
      imageUrlLight: "https://picsum.photos/480/640",
      imageUrlDark: "",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "",
      primaryButtonLink: "",
      navigationButtonLabel: "",
    },
  ],
  isReady: true,
};

export const featureIntroMockData: GenericAwarenessModalContentCard = {
  id: "featureIntro",
  layout: GenericAwarenessModalLayout.FeatureIntro,
  imageUrlLight: "https://picsum.photos/640/360",
  imageUrlDark: "",
  title: "Connect a Ledger device",
  subtitle: "To unlock the full potential of your Ledger Wallet, connect a Ledger device.",
  primaryButtonLabel: "Connect",
  primaryButtonLink: "",
  secondaryButtonLabel: "Buy your Ledger device",
  secondaryButtonLink: "",
  items: [
    {
      icon: "HandCoins",
      title: "Full ownership",
      subtitle: "Your private keys never leave the device.",
    },
    {
      icon: "ShieldLock",
      title: "Trade securely",
      subtitle: "Verify transactions on a secure screen.",
    },
    {
      icon: "Wallet",
      title: "Access the most powerful wallet",
      subtitle: "Manage thousands of assets in one place.",
    },
  ],
  isReady: true,
};

export const promptMockData: GenericAwarenessModalPrompt = {
  id: "prompt",
  layout: GenericAwarenessModalLayout.Prompt,
  imageUrlLight: "https://picsum.photos/480/640",
  imageUrlDark: "",
  title: "Try Ledger Wallet when you are ready",
  subtitle: "Open the feature from Ledger Wallet whenever you need it.",
  primaryButtonLabel: "Learn more",
  primaryButtonLink: "https://www.ledger.com",
  secondaryButtonLabel: "Buy your Ledger device",
  secondaryButtonLink: "ledgerlive://buy",
};
