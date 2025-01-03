export type Field = {
  name: string;
  value: string;
  setValue: (value: string) => void;
};

export type CardType = {
  id: string;
  name: string;
  fields: Field[];
  onCreate: () => void;
};
