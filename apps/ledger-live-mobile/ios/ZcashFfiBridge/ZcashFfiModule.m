//
//  ZcashFfiModule.m
//  ZcashFfiMobile
//
//  Copyright © 2026 Ledger SAS. All rights reserved.
//

#import <React/RCTBridgeModule.h>

// Declares the Swift module to React Native. Same split as the app's other
// native modules (see ios/ReduceTransparencyModule.m): the implementation is
// Swift, the bridge declaration has to be Objective-C.
@interface RCT_EXTERN_MODULE(ZcashFfiModule, NSObject)

RCT_EXTERN_METHOD(deriveOrchardAddress:(NSString *)ufvk
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Diagnostic only — see the Swift implementation.
RCT_EXTERN_METHOD(threadProbe:(NSString *)ufvk
                  iterations:(nonnull NSNumber *)iterations
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
