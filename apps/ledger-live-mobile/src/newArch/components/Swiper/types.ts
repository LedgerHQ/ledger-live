import { StyleProp, ViewStyle } from "react-native";

type CardWithId = {
  id: number;
};

type SwiperComponentProps<T> = {
  initialCards: T[];
  renderCard: (card: T) => React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  cardContainerStyle?: StyleProp<ViewStyle>;
};

type SwipeValues = { value: number };

type GestureParams = {
  swipeX: SwipeValues;
  swipeY: SwipeValues;
  velocityX: number;
  velocityY: number;
};

export type { CardWithId, SwiperComponentProps, GestureParams, SwipeValues };
