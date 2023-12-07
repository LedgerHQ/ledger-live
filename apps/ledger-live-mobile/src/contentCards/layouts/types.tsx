/**
 * Defines a content card item.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ContentCardItem<P = any> {
  component: React.FC<P>;
  props: P;
}
