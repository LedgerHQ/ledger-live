import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { Pressable } from "react-native";
import BigNumber from "bignumber.js";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import isEqual from "lodash/isEqual";
import useAssetsListViewModel, { type Props } from "../../hooks/useAssetsListViewModel";
import AssetItem from "../AssetItem";

type ViewProps = ReturnType<typeof useAssetsListViewModel>;

const View: React.FC<ViewProps> = ({ assetsToDisplay, onItemPress }) => (
  <Flex testID="AssetsList">
    {assetsToDisplay.map(item => (
      <Pressable
        key={item.currency.id}
        style={({ pressed }: { pressed: boolean }) => [
          { opacity: pressed ? 0.5 : 1.0, marginVertical: 12 },
        ]}
        hitSlop={6}
        onPress={onItemPress.bind(null, item)}
      >
        <Flex height={40} flexDirection="row" columnGap={12}>
          <AssetItem asset={item} balance={BigNumber(item.amount)} />
        </Flex>
      </Pressable>
    ))}
  </Flex>
);

const Component: React.FC<Props> = props => <View {...useAssetsListViewModel(props)} />;

export const AssetShortListView = React.memo(withDiscreetMode(Component), isEqual);
