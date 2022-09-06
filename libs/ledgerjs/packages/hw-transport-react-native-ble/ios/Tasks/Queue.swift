//
//  Queue.swift
//  hw-transport-react-native-ble
//
//  Created by Juan on 07/6/22.
//

import Foundation
import Starscream
import BleTransport

class Queue: NSObject  {
    let BIMWebsocketEndpoint: URL
    let BIMPackQueue: URL
    let BIMHealth: URL
    
    var runner : Runner?                        /// Handler of the current task
    var pendingRequest: URLSessionDataTask?     /// Backend request to unpack a token
    
    var token: String = ""                      /// Tokenized representation of our queue
    var rawQueue: String = ""                   /// Unresolved queue to fetch a token from
    var index: Int = 0                          /// Current index on the queue
    var item: Item?                             /// Current item we are processing
    var tasks: Tasks = Tasks(tasks: [])         /// Resolved items from the queue token
    
    var stopped: Bool = false
    
    public init (
        rawQueue: String,
        endpoint: String
    ) {
        self.rawQueue = rawQueue
        /// This allows us to override the endpoint in case we need to test a new version or staging/prod
        let host = URL(string: endpoint)!.host ?? ""
        self.BIMWebsocketEndpoint = URL(string: "wss://\(host)/ws/channel")!
        self.BIMPackQueue = URL(string: "https://\(host)/queue")!
        self.BIMHealth = URL(string: "https://\(host)/_health")!
        super.init()
        self.resolveTokenFromQueue(true)
    }
    
    /// Exiting the manager or closing an inline installation flow would expect us to cancel any pending installs
    /// When in the LLM main thread paradigm this is easy since the tasks are handled in the same thread as the UI
    /// but here we need to communicate our intent of killing the long running task. This is probably overkill but hey.
    public func stop(_ onStop: @escaping (()->Void)) {
        self.stopped = true
        token = ""
        index = 0
        item = nil
        tasks = Tasks(tasks: [])
        pendingRequest?.cancel()
        
        if let runner = self.runner {
            runner.stop(onStop)
        } else {
            onStop()
        }
    }
    
    /// This used to be the other way around, JavaScript would give us a resolved token and we would unpack the queue from it
    /// but since the API calls were taking longer than the user took to put the app in the background we were force to move this packing
    /// to the native side. Meaning first we decode the tasks from the raw queue and then we fetch the token from it, a bit backwards
    /// but if it works, it's better that the alternative.
    private func resolveTokenFromQueue(_ autoStart: Bool) {
        
        do {
            let tasks: Tasks = try JSONDecoder().decode(Tasks.self, from: self.rawQueue.data(using: .utf8)!)
            
            var request = URLRequest(url: BIMPackQueue)
            request.httpMethod = "PUT"
            request.httpBody = self.rawQueue.data(using: .utf8)!
            
            let session = URLSession.shared
            if let task = self.pendingRequest {
                task.cancel()
            }
            
            /// Pending error handling if backend is toast.
            self.pendingRequest = session.dataTask(with: request) { [self] (data, response, error) in
                if let error = error, let request = self.pendingRequest {
                    if request.progress.isCancelled { return }
                    if (error as NSError).code == NSURLErrorCancelled { // We cancelled because a new request was received.
                        return
                    }
                    onEventWrapper(
                        RunnerAction.runError,
                        withData: ExtraData(code: TransportError.networkDown.rawValue, message: String(describing:error))
                    )
                }
                else if let token = data {
                    self.token = String(decoding: token, as: UTF8.self)
                    self.tasks = tasks
                    
                    if autoStart {
                        self.startNextRunner()
                    }
                }
            }
            
            self.pendingRequest!.resume()
        } catch {
            onEventWrapper(
                RunnerAction.runError,
                withData: ExtraData(message: String(describing:error))
            )
            return
        }
    }
    
    /**
     Allow to override the queue of items that we are using. This happens when we are processing a queue
     and the user adds a new element to it, we essentially invalidate the previous one and replace it with this
     one.
     - Parameter rawQueue: A string representation of the JSOn data of a queue, to be resolved into a token
     */
    public func setRawQueue(rawQueue: String) {
        self.rawQueue = rawQueue
        self.index = 0
        self.resolveTokenFromQueue(self.runner == nil)
    }
    
    /**
     Start the next Runner for this Queue
     */
    private func startNextRunner() -> Void {
        self.item = self.tasks.tasks[self.index]
        if let item = self.item {
            EventEmitter.sharedInstance.dispatch(
                Payload(
                    event: Event.task.rawValue,
                    type: RunnerAction.runStart.rawValue,
                    data: ExtraData(name: item.appName, type: item.operation)
                )
            )
            
            self.runner = Runner(
                endpoint: BIMWebsocketEndpoint,
                health: BIMHealth,
                onEvent: self.onEventWrapper,
                onDone: self.onDoneWrapper,
                withInitialMessage: "{\"token\":\"\(self.token)\",\"index\":\(self.index)}"
            )
        }
    }
    
    /**
     The wrapper is needed to alter the emitted events from a regular Runner in case we want to use runners outside of a Queue
     context. Here we are polyfilling the data from the runner with some extra runner only available at the Queue level, namely
     the application name and the operation. This is used by the UI to reconciliate the state of the application list.
     
     - Parameter type: RunnerAction.runProgress | RunnerAction.runError
     - Parameter withData: Lazy data holder for any event funneled upwards, could do with better typing.
     */
    private func onEventWrapper(_ runnerAction: RunnerAction, withData: ExtraData?) -> Void {
        var wrappedData = withData ?? ExtraData()
        if let item = self.item {
            wrappedData.name = item.appName
            wrappedData.type = item.operation
        }
        
        EventEmitter.sharedInstance.dispatch(
            Payload(
                event: Event.task.rawValue,
                type: runnerAction.rawValue,
                data: wrappedData
            )
        )
    }
    
    
    /**
     This method wraps the internal onDone of a child Runner. The reason for a wrapper is that depending on whether we still
     have elements in the queue or not (ie, more Runners) we will start the next one or communicate the completion of the queue
     through the event emitter.
     
     - Parameter lastScriptRunnerMessage : The last mesage received from the scriptrunner. This allows us to know if
     there are more elements in the queue (as far as that particular token is concerned) or not.
     
     --------------------------------------------------------------------------------------------
     
     - Note  that even if the last message from the scriptrunner is a TERMINATE for instance, we may still have more items because
     the token ha s been updated during the execution of that last Runner. That's why we check against self.tasks right afterward.
     */
    private func onDoneWrapper (_ lastScriptRunnerMessage : String) -> Void {
        if let item = self.item {
            EventEmitter.sharedInstance.dispatch(
                Payload(
                    event: Event.task.rawValue,
                    type: RunnerAction.runSuccess.rawValue,
                    data: ExtraData(name: item.appName, type: item.operation)
                )
            )
            if self.stopped { return }
            
            if (lastScriptRunnerMessage == "CONTINUE") {
                self.index += 1
                self.startNextRunner()
            } else if (self.index+1 < self.tasks.tasks.count) {
                self.index += 1
                self.startNextRunner()
                print("Token modified, try to get next one ignoring the HSM message")
            } else {
                self.runner?.endBackgroundTask()
                self.runner = nil
                EventEmitter.sharedInstance.dispatch(
                    Payload(
                        event: Event.task.rawValue,
                        type: RunnerAction.runComplete.rawValue,
                        data: ExtraData()
                    )
                )
            }
        }
    }
    
    public func onDisconnect(_ code: String, _ message: String, _ error: NSError?) -> Void {
        self.stop({ }) /// Empty because it's a dirty disconenct
        EventEmitter.sharedInstance.dispatch(
            Payload(
                event: Event.task.rawValue,
                type: RunnerAction.runError.rawValue,
                data: ExtraData(code: code, message: message)
            )
        )
    }
}
