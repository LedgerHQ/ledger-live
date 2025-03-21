//
//  SplashScreenModule.m
//  ledgerlivemobile
//
//  Created by Lucas WEREY on 17/03/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridge.h"


@interface RCT_EXTERN_MODULE(RNSplashScreenModule, NSObject)

RCT_EXTERN_METHOD(showSplashScreen)
RCT_EXTERN_METHOD(hideSplashScreen)

@end
