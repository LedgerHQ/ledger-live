import { StyleProp, ViewStyle } from "react-native";

export type TransitionStatus = "entering" | "entered" | "exiting" | "exited";

export interface TransitionProps {
  /**
   * The status of the transition, either "entered", "entering", "exiting" or "exited".
   */
  status: TransitionStatus;
  /**
   * Duration used to transition between statuses.
   */
  duration: number;
  /**
   * Additional styles to pass to the underlying View wrapper.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Children that will get controlled by the transition.
   */
  children: React.ReactNode;
}
