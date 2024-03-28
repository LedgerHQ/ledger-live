import { useTheme } from "styled-components/native";

export const useItemStyle = (isSingleCard: boolean, isFirstItem: boolean, isLastItem: boolean) => {
  const { colors } = useTheme();

  const stylesMap = {
    singleCard: {
      borderRadius: 12,
    },
    firstStackCard: {
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    lastStackCard: {
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      borderTopWidth: 1,
      borderTopColor: colors.opacityDefault.c10,
      borderBottomColor: colors.opacityDefault.c10,
    },
    middleCards: {
      borderTopWidth: 1,
      borderTopColor: colors.opacityDefault.c10,
      borderBottomColor: colors.opacityDefault.c10,
    },
  };

  if (isSingleCard) return stylesMap.singleCard;

  if (isLastItem) return stylesMap.lastStackCard;

  if (isFirstItem) return stylesMap.firstStackCard;

  return stylesMap.middleCards;
};
