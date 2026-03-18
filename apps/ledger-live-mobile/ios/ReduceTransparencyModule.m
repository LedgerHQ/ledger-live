//
//  ReduceTransparencyModule.m
//  ledgerlivemobile
//
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ReduceTransparencyModule, NSObject)

RCT_EXTERN_METHOD(getReduceTransparencyEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
