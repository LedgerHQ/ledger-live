export const ledgerValidatorAddress = "tz3LV9aGKHDnAZHCtC9SjNtTrKRu678FqSki";
const whitelist = [
  "tz1WCd2jm4uSt4vntk4vSuUWoZQGhLcDuR9q",
  "tz1Scdr2HsZiQjc7bHMeBbmDRXYVvdhjJbBh",
  "tz1g8vkmcde6sWKaG2NN9WKzCkDM6Rziq194",
  "tz1PWCDnz783NNGGQjEFFsHtrcK5yBW4E2rm",
  "tz1RV1MBbZMR68tacosb7Mwj6LkbPSUS1er1",
  "tz1KfEsrtDaA1sX7vdM4qmEPWuSytuqCDp5j",
  "tz1V4qCyvPKZ5UeqdH14HN42rxvNPQfc9UZg",
  "tz1Lhf4J9Qxoe3DZ2nfe8FGDnvVj7oKjnMY6",
  "tz1Ldzz6k1BHdhuKvAtMRX7h5kJSMHESMHLC",
  "tz1Kf25fX1VdmYGSEzwFy1wNmkbSEZ2V83sY",
  "tz1RCFbB9GpALpsZtu6J58sb74dm8qe6XBzv",
  "tz1dbfppLAAxXZNtf2SDps7rch3qfUznKSoK",
  "tz2FCNBrERXtaTtNX6iimR1UJ5JSDxvdHM93",
  "tz1SohptP53wDPZhzTWzDUFAUcWF6DMBpaJV",
  "tz1P2Po7YM526ughEsRbY4oR9zaUPDZjxFrb",
  "tz1KzSC1J9aBxKp7u8TUnpN8L7S65PBRkgdF",
  "tz1fJHFn6sWEd3NnBPngACuw2dggTv6nQZ7g",
  "tz1NEKxGEHsFufk87CVZcrqWu8o22qh46GK6",
  "tz1V3yg82mcrPJbegqVCPn6bC8w1CSTRp3f8",
  "tz1aRoaRhSpRYvFdyvgWLL6TGyRoGF51wDjM",
  "tz1MQJPGNMijnXnVoBENFz9rUhaPt3S7rWoz",
  "tz1dRKU4FQ9QRRQPdaH4zCR6gmCmXfcvcgtB",
  "tz1aDiEJf9ztRrAJEXZfcG3CKimoKsGhwVAi",
];

// we give no ordering preference. it's settled at module load time
whitelist.sort(() => Math.random() - 0.5);

const whiteListAddresses = [ledgerValidatorAddress, ...whitelist];

export default whiteListAddresses;
