export type FeatureTourRowIcon = "Contact" | "Link" | "CreditCard";

export type FeatureTourRow = Readonly<{
  icon: FeatureTourRowIcon;
  title: string;
  description: string;
}>;
