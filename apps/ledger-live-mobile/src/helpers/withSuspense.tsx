import { Suspense } from "react";
import { Text } from "react-native";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line react/display-name
export const withSuspense = Component => props => (
  <Suspense fallback={<Text>Loading...</Text>}>
    <Component {...props} />
  </Suspense>
);
