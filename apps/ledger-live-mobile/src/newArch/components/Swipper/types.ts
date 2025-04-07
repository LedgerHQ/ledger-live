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

export type { CardWithId, SwiperComponentProps };
