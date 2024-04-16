import React from "react";
import { useWindowDimensions } from "react-native";
import { ContentLayoutBuilder } from "~/contentCards/layouts/utils";
import { Flex } from "@ledgerhq/native-ui";

type Props = {
  styles?: {
    gap?: number;
  };
};

const defaultStyles = {
  gap: 6,
};

const Grid = ContentLayoutBuilder<Props>(({ items, styles: _styles = defaultStyles }) => {
  const styles = {
    gap: _styles.gap ?? defaultStyles.gap,
  };

  const width = useWindowDimensions().width / 2 - 20;

  return (
    <Flex
      style={{
        marginHorizontal: "auto",
        justifyContent: "center",
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: styles.gap,
      }}
    >
      {items.map(item => {
        return (
          <Flex key={item.props.metadata.id} style={{ width }}>
            <item.component {...item.props} />
          </Flex>
        );
      })}
    </Flex>
  );
});

export default Grid;
