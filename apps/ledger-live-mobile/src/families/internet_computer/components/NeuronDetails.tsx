import { Button, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { CopyableIdentifier } from "./CopyableIdentifier";

export type NeuronDetailAction = {
  // A plain string, not a node: it doubles as the React key, and every caller passes translated text.
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

type SectionProps = {
  title: React.ReactNode;
  hint?: React.ReactNode;
  value?: React.ReactNode;
  children?: React.ReactNode;
};

/**
 * A titled block of the neuron details screen, with an optional headline value on the right.
 *
 * Desktop puts the explanatory copy in tooltips. There is no hover on mobile, so the same text is
 * rendered as a caption under the title rather than dropped.
 */
export const NeuronSection = ({ title, hint, value, children }: SectionProps) => (
  <Flex mb={7}>
    <Flex flexDirection="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
      <Flex flex={1} pr={3}>
        <Text variant="large" fontWeight="semiBold" color="neutral.c100">
          {title}
        </Text>
        {hint ? (
          <Text variant="small" color="neutral.c70" mt={1}>
            {hint}
          </Text>
        ) : null}
      </Flex>
      {value ? (
        <Text variant="large" fontWeight="semiBold" color="neutral.c100">
          {value}
        </Text>
      ) : null}
    </Flex>
    {children}
  </Flex>
);

type DetailRowProps = {
  /** Optional: a row whose value needs no naming, such as a hot key, carries only the value. */
  label?: React.ReactNode;
  hint?: React.ReactNode;
  value?: React.ReactNode;
  /** A long identifier the row is about, such as a neuron id, rendered with its copy control. */
  identifier?: string;
  /** Named by the caller: a row is rendered once per list entry, so a fixed id would collide. */
  identifierCopyTestID?: string;
  actions?: readonly NeuronDetailAction[];
};

/**
 * One labelled value inside a section, with any actions that apply to it.
 *
 * Actions sit on the row rather than in a single footer strip: a neuron offers up to twelve of them,
 * and which apply depends on the neuron's state and on whether the account controls it, so a flat
 * list would leave the user guessing which stat each one acts on.
 */
export const NeuronDetailRow = ({
  label,
  hint,
  value,
  identifier,
  identifierCopyTestID,
  actions,
}: DetailRowProps) => {
  // An action-only row's label is an instruction to act ("Split this neuron into two"), so without
  // its button it tells the user nothing. A row carrying a value stays even at zero: the section
  // total is its rows added up, and dropping a component leaves a heading nothing reconciles with.
  if (!value && !identifier && !actions?.length) return null;

  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      py={3}
      style={{ gap: 12 }}
    >
      <Flex flex={1} style={{ gap: 2 }}>
        {identifier ? (
          <CopyableIdentifier text={identifier} copyTestID={identifierCopyTestID} />
        ) : null}
        {value ? (
          <Text variant="body" fontWeight="semiBold" color="neutral.c100">
            {value}
          </Text>
        ) : null}
        {label ? (
          <Text variant="body" color="neutral.c70">
            {label}
          </Text>
        ) : null}
        {hint ? (
          <Text variant="small" color="neutral.c70">
            {hint}
          </Text>
        ) : null}
      </Flex>
      {actions?.length ? (
        <Flex flexDirection="row" flexWrap="wrap" justifyContent="flex-end" style={{ gap: 8 }}>
          {actions.map(action => (
            <Button
              key={action.label}
              type="main"
              size="small"
              outline
              onPress={action.onPress}
              disabled={action.disabled}
              testID={action.testID}
            >
              {action.label}
            </Button>
          ))}
        </Flex>
      ) : null}
    </Flex>
  );
};
