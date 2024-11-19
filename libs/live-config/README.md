<img src="https://user-images.githubusercontent.com/3273751/151214602-f5153588-1911-4456-ae65-604d56821b36.png" height="80" /> <img src="https://user-images.githubusercontent.com/211411/52533081-e679d380-2d2e-11e9-9c5e-571e4ad0107b.png" height="80" />

[![Ledger Devs Slack](https://img.shields.io/badge/Slack-LedgerDevs-yellow.svg?style=flat)](https://ledger-dev.slack.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Welcome to Ledger's @ledgerhq/live-config JavaScript lib.

### Introduction

@ledgerhq/live-config is a versatile TypeScript library designed to manage application configurations dynamically. It supports various data types and integrates seamlessly with different configuration providers.

### Features

- Singleton pattern: Ensures only one instance of the configuration is active.
- Support for multiple data types: string, boolean, number, object, array.
- Custom configuration providers: Extendable to various backend services.
- Easy to use API for fetching configuration values.

### Installation
```
npm install @ledgerhq/live-config
```

or

```
yarn add @ledgerhq/live-config
```

### Usage
## Initializing LiveConfig
LiveConfig is a singleton class. To use it, you must first set a provider and a configuration schema.

Set a Provider
Implement your own provider by extending the Provider interface. Here is an example provider implementation:
```
import { Provider } from "@ledgerhq/live-config/providers/index";
import { ConfigInfo, LiveConfig } from "@ledgerhq/live-config/LiveConfig";

class MyCustomProvider implements Provider {
  getValueByKey(key: string, info: ConfigInfo) {
    // Implement logic to retrieve the value for the given key
    // This can be an API call, local storage access, etc.
  }
}

const myProvider = new MyCustomProvider();
LiveConfig.setProvider(myProvider);
```

Set Configuration Schema
Define your configuration schema as follows:

```
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

const configSchema = {
  key1: { type: "string", default: "value1" },
  key2: { type: "boolean", default: false },
  key3: { type: "number", default: 1 },
  key4: {
    type: "object",
    default: {
      url: "https://url.com",
      supportedCurrencies: ["btc", "eth"],
    },
  },
};

LiveConfig.setConfig(configSchema);
```

## Retrieving Configuration Values
To retrieve a value from the configuration, use the getValueByKey method:
```
const value = LiveConfig.getValueByKey("key1");
```