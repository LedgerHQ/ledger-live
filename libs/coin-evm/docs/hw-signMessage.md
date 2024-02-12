# `hw-signMessage.ts`
Functions necessary to message signature. 
(⚠️ not transactions. If you don't know the difference, you can read about it [here](https://aag.ventures/academy/message-signing-and-transaction-signing/)) 

## Methods

#### prepareMessageToSign
Messages are generally provided as a simple string, while they could be either indeed a string or a stringified/serialized JSON depending on the standard of that message. This method is here to take the string parameter and deserialize it if necessary in order to provided with the expected format and with a detected standard. Those standards can be either [EIP-191](https://eips.ethereum.org/EIPS/eip-191) or [EIP-712](https://eips.ethereum.org/EIPS/eip-712).

#### signMessage
Function responsible for communicating with a signer, and use the correct method to sign the message based on its standard, resulting with the `r`, `s` & `v` parameters of an ECDSA signature.