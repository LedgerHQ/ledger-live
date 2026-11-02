export type TopBarNavigationParams = {
  discover: { name: string; params: { screen: string } };
  search: { name: string; params: { screen: string; params: { source: string } } };
};
