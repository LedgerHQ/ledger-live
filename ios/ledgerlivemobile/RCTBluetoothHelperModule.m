//
//  RCTBluetoothHelperModule.m
//  ledgerlivemobile
//
//  Created by jelbaz on 12/07/2021.
//  Copyright © 2021 Ledger SAS. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "RCTBluetoothHelperModule.h"

@implementation Delegate
- (instancetype)initWithPromise: (RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  if(self = [super init]) {
    // Calling initWithDelegate() is enough to show a prompt with a redirect to the bluetooth settings.
    // (option "CBCentralManagerOptionShowPowerAlertKey" is true by default)
    // See: https://developer.apple.com/documentation/corebluetooth/cbcentralmanager/central_manager_initialization_options?language=objc
    self.centralManager = [[CBCentralManager alloc] initWithDelegate:self queue:nil];
    self.resolve = resolve;
    self.reject = reject;
  }
  return self;
}
- (void)centralManagerDidUpdateState:(CBCentralManager *)central {
  self.resolve(nil);
  
  // Keeping the following lines commented for reference, if we ever want to be more accurate.
  
  /*
  if(!self.centralManager) {
    return;
  }
  
  switch ([central state])
  {
    case CBCentralManagerStatePoweredOn:
      // Bluetooth LE is turned on and ready for communication.
      self.resolve(nil);
      break;
    case CBCentralManagerStateUnsupported:
      self.reject(@"bluetooth_unsupported", @"This device does not support Bluetooth Low Energy.", nil);
      break;
    case CBCentralManagerStateUnauthorized:
      self.reject(@"bluetooth_unauthorized", @"This app is not authorized to use Bluetooth Low Energy.", nil);
      break;
    case CBCentralManagerStatePoweredOff:
      self.reject(@"bluetooth_powered_off", @"Bluetooth on this device is currently powered off.", nil);
      break;
    case CBCentralManagerStateResetting:
      self.reject(@"bluetooth_resetting", @"The BLE Manager is resetting; a state update is pending.", nil);
      break;
    case CBCentralManagerStateUnknown:
      self.reject(@"bluetooth_unknown", @"The state of the BLE Manager is unknown.", nil);
      break;
    default:
      self.reject(@"bluetooth_unknown", @"The state of the BLE Manager is unknown.", nil);
  }
   */
  
  self.centralManager = nil;
}
@end

@implementation RCTBluetoothHelperModule

// To export a module named BluetoothHelperModule
// Without passing in a name this will export the native module name as the Objective-C class name with “RCT” removed
RCT_EXPORT_MODULE();

/*
 * Prompts the user to enable bluetooth if possible.
 */
RCT_EXPORT_METHOD(prompt: (RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
  self.delegate = [[Delegate alloc] initWithPromise: resolve reject:reject];
}

@end
