import React, { useCallback } from "react";
import { FlatList, FlatListProps, View } from "react-native";

import QuickActionButton, { QuickActionButtonProps } from "../QuickActionButton";

export type QuickActionListProps = Omit<FlatListProps<QuickActionButtonProps>, "renderItem"> & {
  id: string;
  testID?: string;
  isActive?: boolean;
};

const QuickActionList = ({
  numColumns = 3,
  data,
  id,
  testID,
  isActive = false,
  ...otherProps
}: QuickActionListProps): React.ReactElement => {
  const renderItem = useCallback(
    ({ item, index }: { item: QuickActionButtonProps; index: number }) => {
      const isNotLastColumn = (index + 1) % numColumns > 0;
      const isNotLastItem = data && index !== data.length - 1;
      const hasButtonToItsRight = isNotLastColumn && isNotLastItem;
      const hasRowBelow = data?.length && index + numColumns < data.length;

      const mr = hasButtonToItsRight ? 4 : 0;
      const mb = hasRowBelow ? 4 : 0;
      return (
        <View style={{ flex: 1, minHeight: 30 }}>
          <QuickActionButton {...item} isActive={isActive} mr={mr} mb={mb} testID={testID} />
        </View>
      );
    },
    [],
  );

  return (
    <FlatList
      {...otherProps}
      data={data}
      keyExtractor={(_item, index) => `${id}${index}`}
      horizontal={false}
      renderItem={renderItem}
      numColumns={numColumns}
    />
  );
};

export default QuickActionList;
