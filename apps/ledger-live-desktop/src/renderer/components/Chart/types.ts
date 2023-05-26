export type Item = {
  date: Date;
  value: number;
  countervalue?: number;
};

type EnrichedItem = {
  date: string;
  value: number;
  parsedDate: Date;
  ref: Item;
};

export type Data = Item[];

export type EnrichedData = EnrichedItem[];

export type CTX = {
  NODES: object;
  MARGINS: object;
  COLORS: object;
  INVALIDATED: object;
  HEIGHT: number;
  WIDTH: number;
  DATA: EnrichedData;
  x: Function;
  y: Function;
};
