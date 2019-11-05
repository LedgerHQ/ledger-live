// @flow

// unfinished list...
const whitelist = [
  "tz1d6Fx42mYgVFnHUW8T8A7WBfJ6nD9pVok8",
  "tz3adcvQaKXTCg12zbninqo3q8ptKKtDFTLv"
];

// we give no ordering preference. it's settled at module load time
whitelist.sort(() => Math.random() - 0.5);

export default whitelist;
