#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(HwTransportReactNativeBle, RCTEventEmitter)
    RCT_EXTERN_METHOD(listen: (RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
    RCT_EXTERN_METHOD(stop: (RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
    RCT_EXTERN_METHOD(connect: (NSString *)string resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
    RCT_EXTERN_METHOD(disconnect: (RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
    RCT_EXTERN_METHOD(exchange: (NSString *)apdu resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
    RCT_EXTERN_METHOD(isConnected: (RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

    RCT_EXTERN_METHOD(onAppStateChange: (BOOL *) awake)
RCT_EXTERN_METHOD(queue: (NSString *) token endpoint: (NSString *) endpoint)
    RCT_EXTERN_METHOD(observeBluetooth)
@end
