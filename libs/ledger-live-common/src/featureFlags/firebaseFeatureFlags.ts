import { PropsWithChildren } from "react";
import { snakeCase } from "lodash";

export type FirebaseFeatureFlagsProviderProps = PropsWithChildren<unknown>;
export const formatToFirebaseFeatureId = (id: string) => `feature_${snakeCase(id)}`;
