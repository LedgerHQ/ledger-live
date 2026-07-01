export type PnlDetailItem = {
  title: string;
  description: string;
  value: string;
  percentage?: number;
};

export type PnlDetailProps = {
  title: string;
  description: string;
  items: PnlDetailItem[];
  disclaimer: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
