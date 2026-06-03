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
      imageUrl: "https://picsum.photos/480/640",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "",
      primaryButtonLink: "",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "",
      primaryButtonLink: "",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "",
      primaryButtonLink: "",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "",
      primaryButtonLink: "",
    },
  ],
};

export const carouselWithPrimaryLinksMockData: GenericAwarenessModalContentCard = {
  id: "carouselWithPrimaryLinks",
  layout: GenericAwarenessModalLayout.Carousel,
  data: [
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "Learn more external",
      primaryButtonLink: "https://www.ledger.com",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "Learn more internal",
      primaryButtonLink: "ledgerlive://earn",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "Learn more external",
      primaryButtonLink: "https://www.ledger.com",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "Learn more internal",
      primaryButtonLink: "ledgerlive://earn",
    },
  ],
};

export const carouselMockData: GenericAwarenessModalContentCard = {
  id: "carousel",
  layout: GenericAwarenessModalLayout.Carousel,
  data: [
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "Learn more external",
      primaryButtonLink: "https://www.ledger.com",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "Learn more internal",
      primaryButtonLink: "ledgerlive://earn",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
      primaryButtonLabel: "",
      primaryButtonLink: "",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
      primaryButtonLabel: "",
      primaryButtonLink: "",
    },
  ],
};

export const featureIntroMockData: GenericAwarenessModalContentCard = {
  id: "featureIntro",
  layout: GenericAwarenessModalLayout.FeatureIntro,
  imageUrl: "https://picsum.photos/640/360",
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
};

export const promptMockData: GenericAwarenessModalPrompt = {
  id: "prompt",
  layout: GenericAwarenessModalLayout.Prompt,
  imageUrl: "https://picsum.photos/480/640",
  title: "Try Ledger Wallet when you are ready",
  subtitle: "Open the feature from Ledger Wallet whenever you need it.",
  primaryButtonLabel: "Learn more",
  primaryButtonLink: "https://www.ledger.com",
  secondaryButtonLabel: "Buy your Ledger device",
  secondaryButtonLink: "ledgerlive://buy",
};
