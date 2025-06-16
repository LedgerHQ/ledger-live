import type { Meta, StoryObj } from "@storybook/react-native";
import * as Icons from "@ledgerhq/icons-ui/native";
import NewBannerCard from "../../../src/components/Cards/NewBannerCard";

const meta: Meta<typeof NewBannerCard> = {
  title: "Cards/NewBannerCard",
  component: NewBannerCard,
  argTypes: {
    icon: {
      description: "Icon to display.",
      options: Object.keys(Icons),
      control: { type: "select" },
    },
    onPress: {
      description: "Function to be called when the card is pressed.",
    },
  },
  args: {
    title: "LEDGER SYNC",
    description: "Sync your accounts automatically, even when switching to a new phone.",
    cta: "Turn on Ledger Sync",
    icon: "Refresh",
    unread: true,
    hasExternalLinkIcon: false,
  },
};
export default meta;

type Story = StoryObj<typeof NewBannerCard>;

export const Default: Story = {};

export const LNSUpsell: Story = {
  args: {
    title: "",
    description:
      "Upgrade your Nano S to a newer Ledger — like the Ledger Flex — for more memory, the latest security enhancements, fresh features, and an exclusive 20% off.",
    cta: "Upgrade my Ledger",
    icon: "SparksFill",
    unread: false,
    hasExternalLinkIcon: true,
  },
};
