export const padAddress = (address: string): string => {
  const splittedAddr = address.split("x");
  const hexMiss = 64 - splittedAddr[1].length;
  for (let i = 0; i < hexMiss; i++) {
    splittedAddr[1] = `0${splittedAddr[1]}`;
  }
  return splittedAddr.join("x");
};
