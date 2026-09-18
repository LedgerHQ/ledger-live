#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppleWalletModule, NSObject)

RCT_EXTERN_METHOD(openPaymentSetup:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
