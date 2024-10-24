export const splitAddress = (str: string, length: number) =>
  `${str.slice(0, length)}...${str.slice(-length)}`;
