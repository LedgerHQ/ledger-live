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
  const marginStack = (useWindowDimensions().width - width) / 2;
  const marginSquare = (useWindowDimensions().width - 2 * width - styles.gap) / 2;
  const isStack = styles.widthFactor === WidthFactor.Full;

  return (
    <Flex
      style={{
        marginLeft: isStack ? marginStack : marginSquare,
        justifyContent: "flex-start",
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: isStack ? styles.gap : 16,
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
