//
//  BluetoothHelperModule.m
//  ledgerlivemobile
//
//  Created by Lucas WEREY on 02/12/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BluetoothHelperModule, NSObject)

RCT_EXTERN_METHOD(prompt:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
