//
//  StartupInfoModule.h
//  ledgerlivemobile
//
//  Created by Mounir HAMZAOUI on 24/07/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

#ifndef StartupInfoModule_h
#define StartupInfoModule_h


#endif /* StartupInfoModule_h */

// StartupInfoModule.h
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h> // <-- Add this import

@interface StartupInfoModule : RCTEventEmitter <RCTBridgeModule> // <-- Change base class to RCTEventEmitter

// A method to allow AppDelegate to set the data
+ (void)setStartupType:(NSString *)type duration:(NSTimeInterval)duration;

@end
