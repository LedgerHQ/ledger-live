import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { Flex, Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { FlatList, TouchableOpacity } from "react-native";

// Neurons without an id cannot be acted on, but they still have a stable account identifier, so
// they get a key rather than being dropped from the list.
export const neuronKey = (neuron: ICPNeuron) => neuron.id?.toString() ?? neuron.accountIdentifier;

type Props = {
  neurons: readonly ICPNeuron[];
  renderNeuron: (neuron: ICPNeuron) => React.ReactNode;
  onPressNeuron?: (neuron: ICPNeuron) => void;
  emptyState: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * The account's neurons, shared by the manage and refresh-voting-power screens.
 *
 * Desktop renders a column table; a row of five columns does not survive a phone's width, so each
 * neuron is a card and the callers lay out their own contents.
 */
const NeuronList = ({
  neurons,
  renderNeuron,
  onPressNeuron,
  emptyState,
  header,
  footer,
}: Props) => {
  const renderItem = useCallback(
    ({ item }: { item: ICPNeuron }) => {
      const card = (
        <Flex
          backgroundColor="neutral.c20"
          borderRadius={8}
          p={5}
          mb={4}
          testID={`icp-neuron-row-${neuronKey(item)}`}
        >
          {renderNeuron(item)}
        </Flex>
      );
      return onPressNeuron ? (
        <TouchableOpacity onPress={() => onPressNeuron(item)} activeOpacity={0.7}>
          {card}
        </TouchableOpacity>
      ) : (
        card
      );
    },
    [onPressNeuron, renderNeuron],
  );

  return (
    <FlatList
      style={{ flex: 1 }}
      data={neurons as ICPNeuron[]}
      keyExtractor={neuronKey}
      renderItem={renderItem}
      ListHeaderComponent={header ? <>{header}</> : null}
      ListFooterComponent={footer ? <>{footer}</> : null}
      ListEmptyComponent={
        <Flex p={7} alignItems="center">
          <Text variant="body" color="neutral.c70" textAlign="center">
            {emptyState}
          </Text>
        </Flex>
      }
      contentContainerStyle={{ padding: 16 }}
    />
  );
};

export default NeuronList;
