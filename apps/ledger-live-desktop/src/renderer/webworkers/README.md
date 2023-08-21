# Ledger Live Desktop - Web Worker Architecture Documentation

This documentation describes the new web worker architecture used in the Ledger Live Desktop application.
The purpose of using web workers is to offload CPU-intensive tasks from the main thread, improving the application's responsiveness.

To use the new web worker architecture in Ledger Live Desktop, you simply need to add a script in `workers/` and then import and initialize the web worker as shown in the `renderer/live-common-setup.js` file. The implementation of the `publicKeyTweakAdd` function is automatically configured to use the web workers when you call `setSecp256k1Instance` which is our first example of a web worker here.

If more tasks need to be offloaded, a similar approach can be followed to create and configure additional web workers.

## secp256k1 publicKeyTweakAdd function

Our first web worker was created for handling secp256k1 cryptographic operations.

### Overview

The new web worker architecture is designed for handling the `publicKeyTweakAdd` function, which is part of the secp256k1 cryptographic library. This function is offloaded to multiple web workers to efficiently distribute the workload.

#### Implementation

Here is the basic breakdown of `renderer/live-common-setup.js` implementation connecting the `publicKeyTweakAdd` function to the web workers:

1.  `publicKeyTweakAddWorkerCount` determines the number of web workers that will be spawned to handle the `publicKeyTweakAdd` requests.
2.  `publicKeyTweakAddWorkerResponses` is a Subject from the RxJS library to collect responses from the web workers.
3.  `workers` is an array of initialized web workers.
4.  `runJob` function is responsible for sending a message to the appropriate web worker and returning a Promise that resolves when the worker responds.
5.  The `setSecp256k1Instance` function configures the `publicKeyTweakAdd` implementation to use the web workers. NB: in case of Ledger Live Mobile, we also use this function but set a different implementation.
