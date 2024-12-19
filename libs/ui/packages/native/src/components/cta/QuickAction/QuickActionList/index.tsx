import React, { useCallback } from "react";
import { FlatList, FlatListProps } from "react-native";

import QuickActionButton, { QuickActionButtonProps } from "../QuickActionButton";

export type QuickActionListProps = Omit<FlatListProps<QuickActionButtonProps>, "renderItem"> & {
  id: string;
  testID?: string;
};

const QuickActionList = ({
  numColumns = 3,
  data,
  id,
  testID,
  ...otherProps
}: QuickActionListProps): React.ReactElement => {
  const renderItem = useCallback(
    ({ item, index }: { item: QuickActionButtonProps; index: number }) => {
      return (
        <QuickActionButton
          {...item}
          flex={1}
          mr={(index + 1) % numColumns > 0 && data && index !== data.length - 1 ? 4 : 0}
          mb={data?.length && index + numColumns < data.length ? 4 : 0}
          testID={testID}
        />
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
