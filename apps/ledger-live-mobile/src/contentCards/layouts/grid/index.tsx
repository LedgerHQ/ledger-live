import React from "react";
import { useWindowDimensions } from "react-native";
import { ContentLayoutBuilder } from "~/contentCards/layouts/utils";
import { Flex } from "@ledgerhq/native-ui";
import { WidthFactor } from "~/contentCards/layouts/types";
import { useTheme } from "styled-components/native";

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

const stylesMap = {
  firstStackCard: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastStackCard: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  middleCards: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
};

const Grid = ContentLayoutBuilder<Props>(({ items, styles: _styles = defaultStyles }) => {
  const styles = {
    gap: _styles.gap ?? defaultStyles.gap,
    widthFactor: _styles.widthFactor ?? defaultStyles.widthFactor,
  };
  const { colors } = useTheme();

  const width = useWindowDimensions().width * styles.widthFactor - 20;
  const marginStack = (useWindowDimensions().width - width) / 2;
  const marginSquare = (useWindowDimensions().width - 2 * width - styles.gap) / 2;
  const isStack = styles.widthFactor === WidthFactor.Full;

  const getItemStyle = (isNotSingleCard: boolean, isFirstItem: boolean, isLastItem: boolean) => {
    if (isNotSingleCard) {
      if (isLastItem) {
        return stylesMap.lastStackCard;
      }
      if (isFirstItem) {
        return {
          ...stylesMap.firstStackCard,
          ...(items.length === 2
            ? { borderBottomWidth: 1, borderBottomColor: colors.opacityDefault.c10 }
            : {}),
        };
      }
      return {
        ...stylesMap.middleCards,
        borderTopColor: colors.opacityDefault.c10,
        borderBottomColor: colors.opacityDefault.c10,
      };
    }
    return { borderRadius: 12 };
  };

  return (
    <Flex
      style={{
        marginLeft: isStack ? marginStack : marginSquare,
        justifyContent: "flex-start",
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: isStack ? 0 : 16,
      }}
    >
      {items.map((item, index) => {
        const isLastItem = index === items.length - 1;
        const isFirstItem = index === 0;
        const itemStyle = getItemStyle(items.length > 1, isFirstItem, isLastItem);
        return (
          <Flex key={item.props.metadata.id} style={{ width }}>
            <item.component {...item.props} itemStyle={itemStyle} />
          </Flex>
        );
      })}
    </Flex>
  );
});

export default Grid;
