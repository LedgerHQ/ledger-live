# Testing scripts

Please note that those scripts are intended for testing purposes only and should not be used in a production environment.

Make sure you have the necessary dependencies installed before running the script.

## test-get-address

The `test-get-address.ts` script is used to test the functionality of the `getAddress` method in the `keyring-eth` package. This method is responsible for retrieving the Ethereum address associated with a given public key.

To run the script, execute the following command:

```bash
npx ts-node scripts/test-get-address.ts [<derivation-path>]
```

The script will output the result of the signing operation.

## test-sign-personal-message

The `test-sign-personal-message.ts` script is used to test the functionality of signing a personal message using the `signMessage` method in the `keyring-eth` package. This method is responsible for signing a message with the specified derivation path and message content.

To run the script, execute the following command:

```bash
npx ts-node scripts/test-sign-personal-message.ts "<message>"
```

Replace `<message>` with the actual message you want to sign.

Here is an example usage of the script:

```bash
npx ts-node scripts/test-sign-personal-message.ts "Hello, World"
```

The script will output the result of the signing operation.

## test-sign-eip712-hashed

The `test-sign-eip712-hashed.ts` script is used to test the functionality of signing an EIP712 hashed message using the `signMessage` method in the `keyring-eth` package. This method is responsible for signing a message with the specified EIP712 hashed message content.

To run the script, execute the following command:

```bash
npx ts-node scripts/test-sign-eip712-hashed.ts "<eip712-hashed-message>"
```

Replace `<eip712-hashed-message>` with the actual EIP712 hashed message you want to sign.

Here is an example usage of the script:

```bash
npx ts-node scripts/test-sign-eip712-hashed.ts "{\"domainSeparator\":\"0x1234567890\",\"hashStruct\":\"0xabcdef1234567890\"}"
```

The script will output the result of the signing operation.

## test-sign-eip712

The `test-sign-eip712.ts` script is used to test the functionality of signing an EIP712 message using the `signMessage` method in the `keyring-eth` package. This method is responsible for signing a message with the specified derivation path and EIP712 message content.

To run the script, execute the following command:

```bash
npx ts-node scripts/test-sign-eip712.ts "<eip712-message>"
```

Replace <eip712-message> with the actual EIP712 message you want to sign. The message should be a valid JSON object that conforms to the EIP712 message structure, including the domain, types, primaryType, and message fields.

Here is an example usage of the script:

```bash
npx ts-npx ts-node scripts/scripts/test-sign-eip712.ts "{\"domain\":\"example.com\",\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"}]},\"primaryType\":\"EIP712Domain\",\"message\":{\"name\":\"Test\"}}"
```

The script will output the result of the signing operation.

## test-sign-transaction

The `test-sign-transaction.ts` script is used to test the functionality of signing an Ethereum transaction using the `signTransaction` method in the `keyring-eth` package. This method is responsible for signing a transaction with the specified derivation path, unsigned transaction object, and optional signing options.

To run the script, execute the following command:

```bash
npx ts-node scripts/test-sign-transaction.ts <transaction-hash> [<domain>]
```

Replace `<transaction-hash>` with the actual hash of the transaction you want to sign. Optionally, you can provide `<domain>` which represents the ENS domain associated with the transaction.

Here is an example usage of the script:

```bash
npx ts-node scripts/test-sign-transaction.ts "0x1234567890abcdef" "example.eth"
```

The script will output the signed transaction object.

Please note that before running the script, make sure you have the necessary dependencies installed and have set the `KEYRING_ETH_PROVIDER` environment variable in your `.env` file.
