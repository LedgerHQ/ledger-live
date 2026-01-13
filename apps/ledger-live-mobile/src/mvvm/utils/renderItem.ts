import { ListRenderItemInfo } from "react-native";

/**
 * Helper to render an item directly without having to type assert.
 *
 * @param param
 * Renderer params
 *
 * @returns
 * Returns the item directly without modification.
 */
export function renderItem<T>({ item }: ListRenderItemInfo<unknown>) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return item as T;
}
