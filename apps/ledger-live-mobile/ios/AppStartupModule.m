//
//  AppStartupModule.m
//  ledgerlivemobile
//
//  Copyright © 2026 Ledger SAS. All rights reserved.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppStartupModule, NSObject)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getProcessStartTime)

@end
