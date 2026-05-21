import type { GenericAwarenessModalData } from "./types";

export const carouselWithoutPrimaryLinksMockData: GenericAwarenessModalData = {
  id: "carouselWithoutPrimaryLinks",
  layout: "carousel",
  content: [
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "You can also use the feature\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need dqwdwwdqdwq Lorem ipsum dolor sit amet consectetur, adipisicing elit. Inventore ea placeat labore quidem facilis error quo beatae excepturi sapiente dolor. it\n to earn rewards",
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
    },
  ],
};

export const carouselWithPrimaryLinksMockData: GenericAwarenessModalData = {
  id: "carouselWithPrimaryLinks",
  layout: "carousel",
  content: [
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

export const carouselMockData: GenericAwarenessModalData = {
  id: "carousel",
  layout: "carousel",
  content: [
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
    },
    {
      imageUrl: "https://picsum.photos/480/640",
      title: "Try it when you are ready\n to earn rewards",
      subtitle:
        "Open the feature from Ledger Wallet whenever you need it. lorem ipsum dolor sit amet consectetur",
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
    primaryButtonLabel: "Connect",
    primaryButtonLink: "",
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
