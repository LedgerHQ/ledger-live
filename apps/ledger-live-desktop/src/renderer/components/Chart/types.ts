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
