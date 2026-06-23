export type TopBarNavigationParams = {
  myLedger: { name: string; params: { screen: string; params?: object } };
  discover: { name: string; params: { screen: string } };
  notifications: { name: string; params: { screen: string } };
  settings: { name: string };
  search: { name: string; params: { screen: string; params: { source: string } } };
};
