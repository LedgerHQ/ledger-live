export type AcknowledgementProps = Readonly<{
  acknowledgement: string;
  cta: string;
  disclaimer?: string;
  onConfirm: () => void;
}>;

export type AcknowledgementViewProps = AcknowledgementProps &
  Readonly<{
    hasAcknowledged: boolean;
    onAcknowledgedChange: (hasAcknowledged: boolean) => void;
  }>;
