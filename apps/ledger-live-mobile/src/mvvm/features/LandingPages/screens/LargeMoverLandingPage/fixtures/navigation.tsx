import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LandingPagesNavigatorParamList } from "~/components/RootNavigator/types/LandingPagesNavigator";
import { ScreenName } from "~/const";

const mockParentNavigation = {
  pop: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn().mockReturnValue(true),
  canGoBack: jest.fn().mockReturnValue(true),
  getParent: jest.fn().mockReturnValue(mockParentNavigation),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  getId: jest.fn(),
  getState: jest.fn(),
  setParams: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  closeDrawer: jest.fn(),
} as unknown as NativeStackNavigationProp<
  LandingPagesNavigatorParamList,
  ScreenName.LargeMoverLandingPage
>;
