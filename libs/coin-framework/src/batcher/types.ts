export type Batcher<I, R> = (element: I) => Promise<R>;

export type BatchElement<I, R> = {
  element: I;
  resolve: (value: R) => void;
  reject: (reason?: Error) => void;
};

export type Batch<I, R> = {
  elements: Array<BatchElement<I, R>["element"]>;
  resolvers: Array<BatchElement<I, R>["resolve"]>;
  rejecters: Array<BatchElement<I, R>["reject"]>;
};
