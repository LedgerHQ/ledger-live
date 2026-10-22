/** One key per kind of entity data, added by each `@domain/entity-account-*` package through module augmentation. */
export interface AccountDataRegistry {}

export type AccountDataKind = keyof AccountDataRegistry;

export type AccountDataQuery<K extends AccountDataKind> = AccountDataRegistry[K] extends {
  query: infer Q;
}
  ? Q
  : never;

export type AccountDataResult<K extends AccountDataKind> = AccountDataRegistry[K] extends {
  result: infer R;
}
  ? R
  : never;
