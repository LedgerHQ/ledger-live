// @flow

// unfinished list...
const whitelist = [
  "tz3adcvQaKXTCg12zbninqo3q8ptKKtDFTLv",
  "tz1WCd2jm4uSt4vntk4vSuUWoZQGhLcDuR9q",
  "tz1Z3KCf8CLGAYfvVWPEr562jDDyWkwNF7sT",
  "tz1Scdr2HsZiQjc7bHMeBbmDRXYVvdhjJbBh"
];

// we give no ordering preference. it's settled at module load time
whitelist.sort(() => Math.random() - 0.5);

export default whitelist;
