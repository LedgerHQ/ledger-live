import React from "react";
import { useWindowDimensions } from "react-native";
import { ContentLayoutBuilder } from "~/contentCards/layouts/utils";
import { Flex } from "@ledgerhq/native-ui";
import { WidthFactor } from "~/contentCards/layouts/types";

type Props = {
  styles?: {
    gap?: number;
    widthFactor?: WidthFactor;
  };
};

const defaultStyles = {
  gap: 12,
  widthFactor: WidthFactor.Half,
};

const Grid = ContentLayoutBuilder<Props>(({ items, styles: _styles = defaultStyles }) => {
  const styles = {
    gap: _styles.gap ?? defaultStyles.gap,
    widthFactor: _styles.widthFactor ?? defaultStyles.widthFactor,
  };

  const width = useWindowDimensions().width * styles.widthFactor - 20;

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
