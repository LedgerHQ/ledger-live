import React from "react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";
import Text from "~/renderer/components/Text";

// Named for the family rather than generically: `DetailRow` is already taken by unrelated MVVM code
// (mvvm/features/SwapTransactionStatusDialog), and `Section` is too common to grep for.

const withHint = (label: React.ReactNode, tooltip?: React.ReactNode) =>
  tooltip ? <LabelInfoTooltip text={tooltip}>{label}</LabelInfoTooltip> : label;

type SectionProps = {
  title: React.ReactNode;
  tooltip?: React.ReactNode;
  value?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * A titled block of the manage screen, with an optional headline value on the right.
 *
 * Deliberately not `TableHeader` from TableContainer, which covers the title-plus-tooltip half: it
 * carries a bottom border and padding tuned for sitting inside TableContainer's Card, and has no
 * precedent standalone. Six of those stacked in a modal would read as six full-width rules.
 */
export const NeuronSection = ({ title, tooltip, value, children }: SectionProps) => (
  <Box width="100%" mb={4}>
    <Box horizontal alignItems="center" justifyContent="space-between" mb={3}>
      {withHint(
        <Text ff="Inter|SemiBold" fontSize={5} color="neutral.c100">
          {title}
        </Text>,
        tooltip,
      )}
      {value ? (
        <Text ff="Inter|SemiBold" fontSize={5} color="neutral.c100">
          {value}
        </Text>
      ) : null}
    </Box>
    <Box>{children}</Box>
  </Box>
);

export type NeuronDetailAction = {
  // A plain string, not a node: it doubles as the React key, and every caller passes translated text.
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
};

type DetailRowProps = {
  label: React.ReactNode;
  tooltip?: React.ReactNode;
  value?: React.ReactNode;
  actions?: readonly NeuronDetailAction[];
};

/**
 * One labelled value inside a section, with any actions that apply to it.
 *
 * Per-row action buttons are what no existing staking screen offers: the other families put a single
 * action in the section header or behind a dropdown. A neuron needs several actions per stat, and
 * which ones depend on its state, so they belong on the row.
 */
export const NeuronDetailRow = ({ label, tooltip, value, actions }: DetailRowProps) => (
  <Box horizontal alignItems="center" justifyContent="space-between" py={2} style={{ gap: 12 }}>
    <Box style={{ gap: 4 }}>
      {value ? (
        <Text ff="Inter|SemiBold" fontSize={4} color="neutral.c100">
          {value}
        </Text>
      ) : null}
      {withHint(
        <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
          {label}
        </Text>,
        tooltip,
      )}
    </Box>
    {actions?.length ? (
      <Box horizontal style={{ gap: 8 }}>
        {actions.map(action => (
          <Button
            key={action.label}
            outline
            small
            onClick={action.onClick}
            disabled={action.disabled}
            data-testid={action.testId}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    ) : null}
  </Box>
);
