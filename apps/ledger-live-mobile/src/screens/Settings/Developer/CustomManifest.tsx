import React, { useState, useCallback, useLayoutEffect } from "react";
import { TextInput, StyleSheet, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { useTheme, CompositeScreenProps } from "@react-navigation/native";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Box, Text } from "@ledgerhq/native-ui";
import NavigationScrollView from "~/components/NavigationScrollView";
import { ScreenName } from "~/const";
import KeyboardView from "~/components/KeyboardView";
import ImportIcon from "~/icons/Import";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AppCard from "~/screens/Platform/Catalog/AppCard";
import Plus from "~/icons/Plus";
import Trash from "~/icons/Trash";

const DEFAULT_MANIFEST = `{
  "id": "metamask-test-dapsp",
  "name": "Metamask Test Dapp",
  "private": false,
  "url": "https://metamask.github.io/test-dapp/",
  "dapp": {
    "networks": [
      {
        "currency": "ethereum",
        "chainID": 1,
        "nodeURL": "https://eth-dapps.api.live.ledger.com"
      },
      {
        "currency": "bsc",
        "chainID": 56,
        "nodeURL": "https://bsc-dataseed.binance.org/"
      },
      {
        "currency": "polygon",
        "chainID": 137,
        "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
      },
      {
        "currency": "arbitrum",
        "chainID": 42161,
        "nodeURL": "https://arb1.arbitrum.io/rpc"
      },
      {
        "currency": "optimism",
        "chainID": 10,
        "nodeURL": "https://mainnet.optimism.io"
      }
    ]
  },
  "homepageUrl": "https://metamask.github.io/test-dapp/",
  "icon": "https://cdn.live.ledger.com/icons/platform/1inch.png",
  "platforms": ["android", "ios", "desktop"],
  "apiVersion": "^2.0.0",
  "manifestVersion": "1",
  "branch": "stable",
  "categories": ["tools"],
  "currencies": ["ethereum", "bsc", "polygon", "arbitrum", "optimism"],
  "content": {
    "shortDescription": {
      "en": "Metamask Test Dapp"
    },
    "description": {
      "en": "Metamask Test Dapp"
    }
  },
  "permissions": [],
  "domains": ["http://", "https://"],
  "visibility": "complete"
}`;

const LAGADO_MANIFEST_NOCACHE = `{
  "id": "lagado",
  "author": "",
  "private": false,
  "name": "lagado",
  "url": "https://www.lagado.com/tools/cache-test",
  "homepageUrl": "https://www.lagado.com/tools/cache-test",
  "icon": "",
  "platforms": [
    "ios",
    "android",
    "desktop"
  ],
  "apiVersion": "^2.0.0",
  "manifestVersion": "2",
  "branch": "stable",
  "categories": [
    "DeFi"
  ],
  "currencies": [
    "ethereum"
  ],
  "highlight": false,
  "content": {
    "description": {
      "en": "description"
    },
    "shortDescription": {
      "en": "shortDescription"
    }
  },
  "domains": [
    "http://*"
  ],
  "visibility": "complete",
  "permissions": [],
  "dapp": {
    "provider": "evm",
    "nanoApp": "Ethereum",
    "networks": [
      {
        "currency": "ethereum",
        "chainID": 1,
        "nodeURL": "https://eth-dapps.api.live.ledger.com"
      }
    ]
  }
}`;

const LAGADO_MANIFEST_CACHE = `{
  "id": "lagado",
  "author": "",
  "private": false,
  "name": "lagado",
  "cacheBustingId": 1,
  "url": "https://www.lagado.com/tools/cache-test",
  "homepageUrl": "https://www.lagado.com/tools/cache-test",
  "icon": "",
  "platforms": [
    "ios",
    "android",
    "desktop"
  ],
  "apiVersion": "^2.0.0",
  "manifestVersion": "2",
  "branch": "stable",
  "categories": [
    "DeFi"
  ],
  "currencies": [
    "ethereum"
  ],
  "highlight": false,
  "content": {
    "description": {
      "en": "description"
    },
    "shortDescription": {
      "en": "shortDescription"
    }
  },
  "domains": [
    "http://*"
  ],
  "visibility": "complete",
  "permissions": [],
  "dapp": {
    "provider": "evm",
    "nanoApp": "Ethereum",
    "networks": [
      {
        "currency": "ethereum",
        "chainID": 1,
        "nodeURL": "https://eth-dapps.api.live.ledger.com"
      }
    ]
  }
}`;

const ONEINCH_MANIFEST_NOCACHE = `{
  "$schema": "https://live-app-catalog.ledger.com/schema.json",
  "id": "1inch local",
  "name": "1inch local",
  "url": "https://dapp-browser.apps.ledger.com/v2/",
  "params": {
    "dappUrl": "https://app.1inch.io/?ledgerLive=true",
    "nanoApp": "1inch",
    "dappName": "1inch lld dappname",
    "networks": [
      {
        "currency": "ethereum",
        "chainID": 1,
        "nodeURL": "https://eth-dapps.api.live.ledger.com"
      },
      {
        "currency": "bsc",
        "chainID": 56,
        "nodeURL": "https://bsc-dataseed.binance.org/"
      },
      {
        "currency": "polygon",
        "chainID": 137,
        "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
      }
    ]
  },
  "homepageUrl": "https://1inch.io/",
  "icon": "https://cdn.live.ledger.com/icons/platform/1inch.png",
  "platforms": ["android", "ios", "desktop"],
  "apiVersion": "^2.0.0",
  "manifestVersion": "2",
  "branch": "stable",
  "categories": ["swap"],
  "currencies": ["ethereum", "bsc", "polygon"],
  "content": {
    "shortDescription": {
      "en": "Exchange crypto via a Defi/DEX aggregator on Ethereum mainnet, BSC or Polygon"
    },
    "description": {
      "en": "Exchange crypto via a Defi/DEX aggregator on Ethereum mainnet, BSC or Polygon"
    }
  },
  "permissions": [
    "account.list",
    "account.request",
    "currency.list",
    "message.sign",
    "transaction.signAndBroadcast"
  ],
  "domains": ["https://"],
  "visibility": "complete",
  "overrides": [
    {
      "version": "^3.33.0",
      "platform": "android",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch local mobile",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    },
    {
      "version": "^3.33.0",
      "platform": "ios",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    },
    {
      "version": "^2.71.0",
      "platform": "desktop",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch local",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    }
  ]
}`;

const ONEINCH_MANIFEST_CACHE = `{
  "$schema": "https://live-app-catalog.ledger.com/schema.json",
  "id": "1inch local",
  "name": "1inch local",
  "url": "https://dapp-browser.apps.ledger.com/v2/",
  "cacheBustingId": 1,
  "params": {
    "dappUrl": "https://app.1inch.io/?ledgerLive=true",
    "nanoApp": "1inch",
    "dappName": "1inch lld dappname",
    "networks": [
      {
        "currency": "ethereum",
        "chainID": 1,
        "nodeURL": "https://eth-dapps.api.live.ledger.com"
      },
      {
        "currency": "bsc",
        "chainID": 56,
        "nodeURL": "https://bsc-dataseed.binance.org/"
      },
      {
        "currency": "polygon",
        "chainID": 137,
        "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
      }
    ]
  },
  "homepageUrl": "https://1inch.io/",
  "icon": "https://cdn.live.ledger.com/icons/platform/1inch.png",
  "platforms": ["android", "ios", "desktop"],
  "apiVersion": "^2.0.0",
  "manifestVersion": "2",
  "branch": "stable",
  "categories": ["swap"],
  "currencies": ["ethereum", "bsc", "polygon"],
  "content": {
    "shortDescription": {
      "en": "Exchange crypto via a Defi/DEX aggregator on Ethereum mainnet, BSC or Polygon"
    },
    "description": {
      "en": "Exchange crypto via a Defi/DEX aggregator on Ethereum mainnet, BSC or Polygon"
    }
  },
  "permissions": [
    "account.list",
    "account.request",
    "currency.list",
    "message.sign",
    "transaction.signAndBroadcast"
  ],
  "domains": ["https://"],
  "visibility": "complete",
  "overrides": [
    {
      "version": "^3.33.0",
      "platform": "android",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch local mobile",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    },
    {
      "version": "^3.33.0",
      "platform": "ios",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    },
    {
      "version": "^2.71.0",
      "platform": "desktop",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch local",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    }
  ]
}`;

const HEADERS_MANIFEST_NOCACHE = `{
  "id": "headersSniffer",
  "author": "",
  "private": false,
  "name": "headersSniffer",
  "url": "https://headers.4tools.net/",
  "homepageUrl": "https://headers.4tools.net/",
  "icon": "",
  "platforms": [
    "ios",
    "android",
    "desktop"
  ],
  "apiVersion": "^2.0.0",
  "manifestVersion": "2",
  "branch": "stable",
  "categories": [
    "DeFi"
  ],
  "currencies": [
    "ethereum"
  ],
  "highlight": false,
  "content": {
    "description": {
      "en": "description"
    },
    "shortDescription": {
      "en": "shortDescription"
    }
  },
  "domains": [
    "http://*"
  ],
  "visibility": "complete",
  "permissions": [],
  "dapp": {
    "provider": "evm",
    "nanoApp": "Ethereum",
    "networks": [
      {
        "currency": "ethereum",
        "chainID": 1,
        "nodeURL": "https://eth-dapps.api.live.ledger.com"
      }
    ]
  }
}`;

const HEADERS_MANIFEST_CACHE = `{
  "id": "headersSniffer",
  "author": "",
  "private": false,
  "name": "headersSniffer",
  "cacheBustingId": 1,
  "url": "https://headers.4tools.net/",
  "homepageUrl": "https://headers.4tools.net/",
  "icon": "",
  "platforms": [
    "ios",
    "android",
    "desktop"
  ],
  "apiVersion": "^2.0.0",
  "manifestVersion": "2",
  "branch": "stable",
  "categories": [
    "DeFi"
  ],
  "currencies": [
    "ethereum"
  ],
  "highlight": false,
  "content": {
    "description": {
      "en": "description"
    },
    "shortDescription": {
      "en": "shortDescription"
    }
  },
  "domains": [
    "http://*"
  ],
  "visibility": "complete",
  "permissions": [],
  "dapp": {
    "provider": "evm",
    "nanoApp": "Ethereum",
    "networks": [
      {
        "currency": "ethereum",
        "chainID": 1,
        "nodeURL": "https://eth-dapps.api.live.ledger.com"
      }
    ]
  }
}`;

const DebuggerButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
  text?: string;
}> = ({ onPress, text }) => {
  const { colors } = useTheme();
  return (
    <>
      {text && (
        <Text flex={1} ml={4} variant="body" fontWeight="semiBold">
          {text}
        </Text>
      )}
      <TouchableOpacity style={styles.buttons} onPress={onPress}>
        <ImportIcon size={18} color={colors.grey} />
      </TouchableOpacity>
    </>
  );
};

const AddButton: React.ComponentType<{
  onPress: TouchableOpacityProps["onPress"];
  disabled: boolean;
}> = ({ onPress, disabled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.buttons} onPress={onPress} disabled={disabled}>
      <Plus size={18} color={disabled ? colors.grey : colors.black} />
    </TouchableOpacity>
  );
};

type Props = CompositeScreenProps<
  StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DeveloperCustomManifest>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function CustomManifest({ navigation }: Props) {
  const { colors } = useTheme();
  const { state: list, addLocalManifest, removeLocalManifestById } = useLocalLiveAppContext();
  const [manifest, setManifest] = useState<string | null>(null);

  const onChange = useCallback((val: string) => {
    try {
      setManifest(val);
    } catch (e) {
      setManifest(val);
    }
  }, []);

  const onOpen = useCallback(
    (id: string) => {
      const params = {
        platform: id,
      };
      navigation.navigate({
        name: ScreenName.PlatformApp,
        params,
      });
    },
    [navigation],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Box flexDirection="row">
          <DebuggerButton onPress={() => onChange(JSON.stringify(JSON.parse(DEFAULT_MANIFEST)))} />
          <AddButton
            disabled={manifest === null}
            onPress={() => {
              manifest !== null && addLocalManifest(JSON.parse(manifest));
              setManifest(null);
            }}
          />
        </Box>
      ),
    });
  }, [addLocalManifest, manifest, navigation, onChange, onOpen, removeLocalManifestById]);

  return (
    <KeyboardView>
      <NavigationScrollView>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
            },
          ]}
          value={manifest === null ? "" : manifest}
          onChangeText={onChange}
          placeholder="Paste your manifest json"
          multiline
          autoCorrect={false}
          scrollEnabled={false}
        />
        <>
          <AddButton
            disabled={manifest === null}
            onPress={() => {
              manifest !== null && addLocalManifest(JSON.parse(manifest));
              setManifest(null);
            }}
          />
          <Box flexDirection="row" marginTop={20}>
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(LAGADO_MANIFEST_NOCACHE)))}
              text="Lagado nocache"
            />
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(LAGADO_MANIFEST_CACHE)))}
              text="Lagado cache"
            />
          </Box>
          <Box flexDirection="row">
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(ONEINCH_MANIFEST_NOCACHE)))}
              text="1inch nocache"
            />
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(ONEINCH_MANIFEST_CACHE)))}
              text="1inch cache"
            />
          </Box>
          <Box flexDirection="row">
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(HEADERS_MANIFEST_NOCACHE)))}
              text="Headers Sniffer (nocache)"
            />
            <DebuggerButton
              onPress={() => onChange(JSON.stringify(JSON.parse(HEADERS_MANIFEST_CACHE)))}
              text="Headers Sniffer (cache)"
            />
          </Box>
        </>

        <>
          {list.map(m => {
            return (
              <Box key={m.id} flexDirection="row">
                <TouchableOpacity
                  style={styles.appCardBox}
                  onLongPress={() => {
                    removeLocalManifestById(m.id);
                  }}
                >
                  <AppCard
                    manifest={m}
                    onPress={() => {
                      onOpen(m.id);
                    }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonBox}
                  onPress={() => {
                    removeLocalManifestById(m.id);
                  }}
                >
                  <Trash size={18} color={colors.black} />
                </TouchableOpacity>
              </Box>
            );
          })}
        </>
      </NavigationScrollView>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  buttonBox: {
    marginBottom: 16,
    display: "flex",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  appCardBox: {
    flex: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    marginBottom: 16,
  },
  buttons: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});
