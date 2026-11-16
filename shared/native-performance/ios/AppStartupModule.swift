import Foundation
import React
import UIKit

// A prewarmed or background launch may show the app much later: no start time then.
@objc(AppStartupModule)
public final class AppStartupModule: NSObject, RCTBridgeModule {
  public static func moduleName() -> String! { "AppStartupModule" }
  public static func requiresMainQueueSetup() -> Bool { false }

  private static var processStartTime: Double?

  // Call first in didFinishLaunching, while the launch reason is still known.
  public static func recordLaunch(_ application: UIApplication) {
    let prewarmed = ProcessInfo.processInfo.environment["ActivePrewarm"] == "1"
    let launchedInBackground = application.applicationState == .background
    guard !prewarmed, !launchedInBackground else { return }
    processStartTime = readProcessStartTime()
  }

  // Only the first JS run of the process gets it: a JS restart (RNRestart) does not start the process.
  @objc func getProcessStartTime() -> NSNumber? {
    defer { AppStartupModule.processStartTime = nil }
    return AppStartupModule.processStartTime.map { NSNumber(value: $0) }
  }

  private static func readProcessStartTime() -> Double? {
    var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
    var info = kinfo_proc()
    var size = MemoryLayout<kinfo_proc>.stride
    guard sysctl(&mib, u_int(mib.count), &info, &size, nil, 0) == 0 else { return nil }
    let startTime = info.kp_proc.p_un.__p_starttime
    return Double(Int64(startTime.tv_sec) * 1000 + Int64(startTime.tv_usec) / 1000)
  }
}
