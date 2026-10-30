package com.ledger.live

import android.app.ActivityManager
import android.os.Build
import android.os.Process
import android.os.SystemClock
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// A process started in the background (push, broadcast) may show the app much later: no start time then.
class AppStartupModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    // Only the first JS run of the process gets it: a JS restart (RNRestart) does not start the process.
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getProcessStartTime(): Double? = consumeProcessStartTime()?.toDouble()

    companion object {
        const val NAME = "AppStartupModule"

        private var processStartTime: Long? = null

        // Call first in Application.onCreate, while the launch reason is still known.
        fun recordLaunch() {
            val startTime = runCatching { readForegroundLaunchStartTime() }.getOrNull()
            synchronized(this) { processStartTime = startTime }
        }

        private fun consumeProcessStartTime(): Long? = synchronized(this) {
            processStartTime.also { processStartTime = null }
        }

        private fun readForegroundLaunchStartTime(): Long? {
            val processInfo = ActivityManager.RunningAppProcessInfo()
            ActivityManager.getMyMemoryState(processInfo)
            val launchedInForeground =
                processInfo.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
            if (!launchedInForeground) return null

            // A pre-forked process (USAP) can start long before the launch is requested
            val launchRequestedAt =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    Process.getStartRequestedElapsedRealtime()
                } else {
                    Process.getStartElapsedRealtime()
                }
            val sinceLaunchRequested = SystemClock.elapsedRealtime() - launchRequestedAt
            return System.currentTimeMillis() - sinceLaunchRequested
        }
    }
}
