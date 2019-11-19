// @flow

// unfinished list...
const whitelist = [
  "tz1WCd2jm4uSt4vntk4vSuUWoZQGhLcDuR9q",
  "tz1Z3KCf8CLGAYfvVWPEr562jDDyWkwNF7sT",
  "tz1Scdr2HsZiQjc7bHMeBbmDRXYVvdhjJbBh",
  "tz1VmiY38m3y95HqQLjMwqnMS7sdMfGomzKi",
  "tz1bHzftcTKZMTZgLLtnrXydCm6UEqf4ivca",
  "tz1g8vkmcde6sWKaG2NN9WKzCkDM6Rziq194",
  "tz1PWCDnz783NNGGQjEFFsHtrcK5yBW4E2rm",
  "tz1d6Fx42mYgVFnHUW8T8A7WBfJ6nD9pVok8",
  "tz1RV1MBbZMR68tacosb7Mwj6LkbPSUS1er1",
  "tz1isXamBXpTUgbByQ6gXgZQg4GWNW7r6rKE",
  "tz1KfEsrtDaA1sX7vdM4qmEPWuSytuqCDp5j",
  "tz1b9MYGrbN1NAxphLEsPPNT9JC7aNFc5nA4",
  "tz1gk3TDbU7cJuiBRMhwQXVvgDnjsxuWhcEA",
  "tz1QLXqnfN51dkjeghXvKHkJfhvGiM5gK4tc",
  "tz1V4qCyvPKZ5UeqdH14HN42rxvNPQfc9UZg",
  "tz1Lhf4J9Qxoe3DZ2nfe8FGDnvVj7oKjnMY6",
  "tz1Pwgj6j55akKCyvTwwr9X4np1RskSXpQY4",
  "tz1Ldzz6k1BHdhuKvAtMRX7h5kJSMHESMHLC",
  "tz1NortRftucvAkD1J58L32EhSVrQEWJCEnB"
];

// we give no ordering preference. it's settled at module load time
whitelist.sort(() => Math.random() - 0.5);

export default whitelist;
