//
//  HwTransportReactNativeBle2.swift
//  hw-transport-react-native-ble
//
//  Created by Juan CORTES on 23/6/22.
//

import Foundation
import BleTransport
import Bluejay

enum TransportError: String, CaseIterable {
    case bluetoothRequired = "bluetooth-required"
    case deviceAlreadyConnected = "device-already-connected"
    case deviceDisconnected = "device-disconnected"
    case networkDown = "network-down"
    case cantOpenDevice = "cant-open-device"
    case pairingFailed = "pairingFailed"
    case userPendingAction = "userPendingAction"
    case writeError = "writeError"
    case unknownError = "unknownError"
}

@objc(HwTransportReactNativeBle)
class HwTransportReactNativeBle: RCTEventEmitter {
    var rejectCallback: ((_ code: String, _ message: String, _ error: NSError?) -> Void)?
    var queueTask: Queue?
    var runnerTask: Runner?
    
    override init() {
        super.init()
        print(BleTransport.shared)
        EventEmitter.sharedInstance.registerEventEmitter(eventEmitter: self)
    }
    
    @objc func observeBluetooth() -> Void {
        BleTransport.shared.bluetoothAvailabilityCallback { available in
            EventEmitter.sharedInstance.dispatch(
                Payload(
                    event: Event.status.rawValue,
                    type: available ? "PoweredOn" : "PoweredOff",
                    data: nil
                )
            )
        }
    }
    
    @objc func listen(
        _ resolve: @escaping RCTPromiseResolveBlock,
        reject: RCTPromiseRejectBlock
    ) -> Void {
        if !BleTransport.shared.isBluetoothAvailable {
            reject(TransportError.bluetoothRequired.rawValue, "", nil)
            return
        }
        
        DispatchQueue.main.async {
            
            BleTransport.shared.scan { discoveries in
                let devices = discoveries.map{
                    ExtraData(
                        id: $0.peripheral.uuid.uuidString,
                        rssi: $0.rssi,
                        name: $0.peripheral.name,
                        serviceUUIDs: [$0.serviceUUID.uuidString]
                    )
                }
                
                EventEmitter.sharedInstance.dispatch(
                    Payload(
                        event: Event.newDevices.rawValue,
                        type: Event.newDevices.rawValue,
                        data: ExtraData(
                            devices: devices
                        )
                    )
                )
            } stopped: {_ in }
        }
    }
    
    @objc func stop(
        _ resolve: @escaping RCTPromiseResolveBlock,
        reject: RCTPromiseRejectBlock
    ) -> Void {
        if BleTransport.shared.isBluetoothAvailable {
            DispatchQueue.main.async {
                BleTransport.shared.stopScanning()
                resolve(true)
            }
        }
    }
    
    @objc func isConnected(_ resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        resolve(BleTransport.shared.isConnected)
    }
    
    @objc func connect(
        _ uuid: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        if !BleTransport.shared.isBluetoothAvailable {
            reject(TransportError.bluetoothRequired.rawValue, "", nil)
            return
        }
        
        let peripheral = PeripheralIdentifier(uuid: UUID(uuidString: uuid)!, name: "")
        var consumed = false /// Callbacks can only be called once in rn
        
        DispatchQueue.main.async {
            BleTransport.shared.connect(toPeripheralID: peripheral, timeout: .seconds(5)){
                /// Disconnect callback is called regardless of the original -connect- having resolved already
                /// we use this to notify exchanges (background or foreground) about the disconnection.
                if consumed {
                    if let rejectCallback = self.rejectCallback {
                        rejectCallback(TransportError.cantOpenDevice.rawValue, "", nil)
                        print("ble-verbose unhandled disconnect")
                    }
                    return
                }
            } success: { PeripheralIdentifier in
                if consumed { return }
                resolve(uuid)
                consumed = true
            } failure: { error in
                if consumed { return }
                reject(TransportError.pairingFailed.rawValue, "", nil)
                consumed = true
            }
        }
    }
    
    @objc func disconnect(
        _ resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        let disconnectImpl = {
            DispatchQueue.main.async {
                BleTransport.shared.disconnect(immediate: false, completion: { _ in
                    resolve(true)
                })
            }
        }
        
        /// Prevent race condition between organic disconnect (allow open app) and explicit disconnection below.
        DispatchQueue.main.asyncAfter(deadline: .now() + 3){
            if !BleTransport.shared.isConnected {
                resolve(true)
            } else if let queueTask = self.queueTask {
                queueTask.stop(disconnectImpl)
                self.queueTask = nil
            } else {
                disconnectImpl()
            }
        }
    }
    
    @objc func exchange(
        _ apdu: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) -> Void {
        if !BleTransport.shared.isConnected {
            reject(TransportError.deviceDisconnected.rawValue, "", nil)
            return
        }
        
        self.rejectCallback = reject /// Get notified if the device disconnects while we wait
        
        DispatchQueue.main.async {
            BleTransport.shared.exchange(apdu: APDU(raw: apdu)) { result in
                switch result {
                case .success(let response):
                    self.rejectCallback = nil
                    resolve(response)
                case .failure(let error):
                    switch error {
                    case .writeError(let error):
                        reject(TransportError.writeError.rawValue, String(describing:error), nil)
                    case .pendingActionOnDevice:
                        reject(TransportError.userPendingAction.rawValue, "", nil)
                    default:
                        reject(TransportError.writeError.rawValue, "", nil)
                    }
                }
            }
        }
    }
    
    @objc func queue(_ rawQueue: String, endpoint: String) -> Void {
        if let queue = self.queueTask {
            // If the queue is stopped we create a new one
            if !queue.stopped {
                queue.setRawQueue(rawQueue: rawQueue)
                return
            }
        }
        
        self.queueTask = Queue(rawQueue: rawQueue, endpoint: endpoint)
        
        /// While running a queue, if the device disconnects we wouldn't be notified because we are already
        /// dealing with a connected device and the callback will come from the -connect- from this file. In order
        /// to handle this eventuality, register here what to do in that case.
        self.rejectCallback = self.queueTask?.onDisconnect
    }
    
    @objc func runner(_ endpoint: String) -> Void {
        self.runnerTask = Runner(
            endpoint: URL(string: endpoint)!,
            health: nil
        ) { (action, data) in
            /// TBD if we need to emit the individual exchanges or progress is enough
            if case .runProgress = action {
                /// Map this progress to the raw socket.ts event mark
                EventEmitter.sharedInstance.dispatch(
                    Payload(
                        event: Event.task.rawValue,
                        type: RunnerAction.runBulkProgress.rawValue,
                        data: data
                    )
                )
            }
        } onDone: { finalMessage in
            EventEmitter.sharedInstance.dispatch(
                Payload(
                    event: Event.task.rawValue,
                    type: RunnerAction.runComplete.rawValue,
                    data: nil
                )
            )
        }
    }
    
    @objc func onAppStateChange(
        _ awake: Bool
    ) -> Void {
        EventEmitter.sharedInstance.onAppStateChange(awake: awake)
    }
    
    @objc open override func supportedEvents() -> [String] {
        return EventEmitter.sharedInstance.allEvents
    }
}
