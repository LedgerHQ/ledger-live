import { BaseNavigatorStackParamList } from "./types/BaseNavigator";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends BaseNavigatorStackParamList {}
  }
}
