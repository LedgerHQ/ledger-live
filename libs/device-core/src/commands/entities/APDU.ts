export type APDU = [
  /* 1 byte unsigned int */
  cla: number,
  /* 1 byte unsigned int */
  ins: number,
  /* 1 byte unsigned int */
  p1: number,
  /* 1 byte unsigned int */
  p2: number,
  /* data (optional) */
  data: Buffer | undefined,
];
