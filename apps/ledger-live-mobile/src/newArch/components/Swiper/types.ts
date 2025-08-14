import { StyleProp, ViewStyle } from "react-native";

type CardWithId = {
  idCard: number;
};

type SwiperComponentProps<T> = {
  initialCards: T[];
  renderCard: (card: T) => React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  cardContainerStyle?: StyleProp<ViewStyle>;
  currentIndex: number;
  onIndexChange: (index: number) => void;
};

type SwipeValues = { value: number };

type GestureParams = {
  swipeX: SwipeValues;
  swipeY: SwipeValues;
  velocityX: number;
  velocityY: number;
};

export type { CardWithId, SwiperComponentProps, GestureParams, SwipeValues };
