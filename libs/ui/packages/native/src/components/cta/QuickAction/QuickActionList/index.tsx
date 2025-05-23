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
      return (
        <View style={{ flex: 1, minHeight: 30 }}>
          <QuickActionButton
            {...item}
            isActive={isActive}
            mr={(index + 1) % numColumns > 0 && data && index !== data.length - 1 ? 4 : 0}
            mb={data?.length && index + numColumns < data.length ? 4 : 0}
            testID={testID}
          />
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
