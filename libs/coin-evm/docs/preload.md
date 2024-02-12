# `preload.ts`

Standard functions responsible for collecting and adding tokens based on either CDN requests of the CryptoAssets List (CAL) or based on cached data in the library client.

## Methods

#### fetchERC20Tokens
In charge of dynamically fetch ERC20 tokens definitions from the CAL CDN for a specific chainId and return them as an array. This call should have a cache in order to avoid infra cost. (As of today, the cache is set to 6 hours)

#### preload <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
Using the `fetchERC20Tokens` method, the function will trigger the asynchronous request for the tokens and set them as token for the used currency in the `@ledgerhq/cryptoassets` library. The returned data of this method is cached by the client.

#### hydrate <sub><sup><sub><sup>[standard]</sup><sub></sup><sub>
In charge of setting the cached tokens cached by the `preload` method in order for the live to be operational at launch.

**Important:** An analysis of the necessity of this cache to exist has been written [here](https://ledger.enterprise.slack.com/docs/T032Z0S1J/F05B8R0903W). If this cache mecanism is kept, the `preload` method should only return the tokens missing/changed compared to the local `@ledgerhq/cryptoassets` files in order to avoid storing multiple Mb of unecessary data in LocalStorage.