//
//  RCTBluetoothHelperModule.h
//  ledgerlivemobile
//
//  Created by jelbaz on 12/07/2021.
//  Copyright © 2021 Ledger SAS. All rights reserved.
//

#ifndef RCTBluetoothHelperModule_h
#define RCTBluetoothHelperModule_h

#import <React/RCTBridgeModule.h>
#import <CoreBluetooth/CoreBluetooth.h>

@interface Delegate : NSObject<CBCentralManagerDelegate>
@property CBCentralManager *centralManager;
@property RCTPromiseResolveBlock resolve;
@property RCTPromiseRejectBlock reject;
- (instancetype)initWithPromise: (RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
@end

@interface RCTBluetoothHelperModule : NSObject <RCTBridgeModule>
@property(strong) Delegate * delegate;
@end

#endif /* RCTBluetoothHelperModule_h */
