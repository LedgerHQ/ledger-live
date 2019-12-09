// @flow

// unfinished list...
const whitelist = [
  "tz1WCd2jm4uSt4vntk4vSuUWoZQGhLcDuR9q",
  "tz1Scdr2HsZiQjc7bHMeBbmDRXYVvdhjJbBh",
  "tz1VmiY38m3y95HqQLjMwqnMS7sdMfGomzKi",
  "tz1bHzftcTKZMTZgLLtnrXydCm6UEqf4ivca",
  "tz1g8vkmcde6sWKaG2NN9WKzCkDM6Rziq194",
  "tz1PWCDnz783NNGGQjEFFsHtrcK5yBW4E2rm",
  "tz1d6Fx42mYgVFnHUW8T8A7WBfJ6nD9pVok8",
  "tz1RV1MBbZMR68tacosb7Mwj6LkbPSUS1er1",
  "tz1KfEsrtDaA1sX7vdM4qmEPWuSytuqCDp5j",
  "tz1gk3TDbU7cJuiBRMhwQXVvgDnjsxuWhcEA",
  "tz1QLXqnfN51dkjeghXvKHkJfhvGiM5gK4tc",
  "tz1Lhf4J9Qxoe3DZ2nfe8FGDnvVj7oKjnMY6",
  "tz1Pwgj6j55akKCyvTwwr9X4np1RskSXpQY4",
  "tz1egbN6RK2bM5vt4aAZw6r9j4nL8z49bPdS",
  "tz1Ldzz6k1BHdhuKvAtMRX7h5kJSMHESMHLC",
  "tz1NortRftucvAkD1J58L32EhSVrQEWJCEnB",
  "tz1Kf25fX1VdmYGSEzwFy1wNmkbSEZ2V83sY",
  "tz1RCFbB9GpALpsZtu6J58sb74dm8qe6XBzv",
  "tz1eEnQhbwf6trb8Q8mPb2RaPkNk2rN7BKi8",
  "tz1PeZx7FXy7QRuMREGXGxeipb24RsMMzUNe"
];

// we give no ordering preference. it's settled at module load time
whitelist.sort(() => Math.random() - 0.5);

export default whitelist;
