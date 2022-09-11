//
//  EventEmitter.swift
//  hw-transport-react-native-ble
//
//  Created by Juana on 27/5/22.
//

import Foundation


enum Event: String, CaseIterable {
    case parent = "BleTransport"
    case newDevices = "replace"
    case status = "status"
    case apdu = "apdu" /// We are currently not exposing these when in background
    case task = "task"
}

enum RunnerAction: String, CaseIterable {
    case runStart = "runStart"
    case runProgress = "runProgress"
    case runBulkProgress = "runBulkProgress" /// Raw runner event, no queue
    case runSuccess = "runSuccess"
    case runComplete = "runComplete"
    case runError = "runError"
}

/// Event payloads
struct Payload: Codable {
    let event: String
    var type: String
    let data: ExtraData?
}

struct Tasks: Codable {
    let tasks: [Item]
}

struct Item: Codable {
    let operation: String
    let targetId: Int
    let appName: String
}

struct Device: Codable {
    var id: String?
    var rssi: Int?
    var name: String?
    var serviceUUIDs: [String]?
}

struct ExtraData: Codable {
    var msg: String?
    
    /// Devices
    var devices: [Device]?
    
    /// Bulk action extras
    var progress: Double?
    var index: Int?
    var total: Int?
    
    /// Queue action extras
    var queueItem: Int?
    var name: String?
    var type: String?
    
    /// Error extras
    var code: String?
    var message: String?
}

class EventEmitter {
    public static let sharedInstance = EventEmitter()
    private var eventEmitter: HwTransportReactNativeBle!
    
    private var isJavaScriptAvailable: Bool = true
    private var isConsumingQueue: Bool = false
    private var queuedEvents:[Payload] = []
    
    /// Throttling optimization feat
    private var pendingEvent : DispatchSourceTimer!
    private var lastEventTime : Double = 0
    private var lastEvent : Payload?
    private var throttle : Int = 1500 /// Minimum time in ms between events of same type.
    
    private init() {}
    
    func registerEventEmitter(eventEmitter: HwTransportReactNativeBle) {
        self.eventEmitter = eventEmitter
    }
    
    func onAppStateChange(awake: Bool) {
        self.isJavaScriptAvailable = awake
        if awake {
            self.consumeEventQueue()
        }
    }
    
    func dispatch(_ payload: Payload) {
        if self.queuedEvents.count > 0 {
            let previousLog = self.queuedEvents.last
            if previousLog?.type == payload.type
                && previousLog?.event == payload.event {
                self.queuedEvents[self.queuedEvents.count-1] = payload
                self.consumeEventQueue()
                return
            }
        }
        self.queuedEvents.append(payload)
        self.consumeEventQueue()
    }
    
    /// Expected to be able to take care of any background running task that emits events, it is initially conceived to support socket connections
    /// to script runners such as those used for app installations, firmware updates, and queue consumptions through the BIM system. The events
    /// will mostly be consistent throughout all implementations but may need some tweaking.
    private func consumeEventQueue () {
        if !self.isJavaScriptAvailable || self.isConsumingQueue {
            return
        }
        
        self.isConsumingQueue = true /// Lock this regardless of app state
        
        while self.queuedEvents.count > 0 && self.isJavaScriptAvailable {
            let event = self.queuedEvents.removeFirst()
            
            let exec: () -> Void = {
                self.eventEmitter.sendEvent(withName:Event.parent.rawValue, body: event.dictionary)
                self.lastEvent = event
                self.lastEventTime = Date().timeIntervalSince1970
                
                if self.pendingEvent != nil {
                    self.pendingEvent.cancel()
                    self.pendingEvent = nil
                }
            }
            
            /// Prepare some flags
            let isTooSoon = (self.lastEventTime + Double(self.throttle)/1000) >= Date().timeIntervalSince1970
            var isEventForSameTask = false
            if let lastEvent = self.lastEvent {
                isEventForSameTask = lastEvent.type == event.type && lastEvent.data?.name == event.data?.name
            }
            
            /// There's a scheduled event of the same type for the same app, replace it with this one
            if self.pendingEvent != nil && isEventForSameTask {
                self.pendingEvent.setEventHandler(handler: exec)
            }

            /// It's too soon to dispatch another event of the same task
            else if isTooSoon && isEventForSameTask {
                let offset = Date(timeIntervalSince1970: TimeInterval((self.lastEventTime))).timeIntervalSinceNow
                let msOffset = Int(offset * 1000) + self.throttle
                
                self.pendingEvent = DispatchSource.makeTimerSource(queue: DispatchQueue.main)
                self.pendingEvent.schedule(deadline: .now() + .milliseconds(msOffset))
                self.pendingEvent.setEventHandler(handler: exec)
                self.pendingEvent.resume()
            }

            /// All other cases can safely dispatch the event
            else {
                exec()
            }
        }
        
        /// Yummy!
        self.isConsumingQueue = false
    }
    
    lazy var allEvents: [String] = {
        return ["BleTransport"] // All events can be wrapped through this channel.
    }()
}

extension Encodable {
    var dictionary: [String: Any]? {
        guard let data = try? JSONEncoder().encode(self) else { return nil }
        return (try? JSONSerialization.jsonObject(with: data, options: .allowFragments)).flatMap { $0 as? [String: Any] }
    }
}
