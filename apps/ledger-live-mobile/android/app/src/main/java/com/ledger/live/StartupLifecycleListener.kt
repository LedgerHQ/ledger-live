package com.ledger.live

import android.app.Activity
import android.app.Application
import android.os.Bundle
import android.os.SystemClock
import android.util.Log

class StartupLifecycleListener(private val appProcessStartTime: Long) : Application.ActivityLifecycleCallbacks {

    private val TAG = "StartupListener"

    // Flags and timestamps managed by this listener
    private var appBackgroundEnterTime: Long = 0
    private var didEnterBackgroundSinceLastActive: Boolean = false // Flag if the app was sent to background

    // This flag ensures that onActivityResumed's hot/warm logic only runs AFTER
    // the initial cold launch sequence (from MainApplication.onCreate) has finished
    // and this listener has seen the first activity resume.
    private var hasBeenInitiallyResumed = false

    init {
        Log.d(TAG, "StartupLifecycleListener initialized. AppProcessStartTime: $appProcessStartTime ms")
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
        Log.d(TAG, "Native: Listener - onActivityCreated: ${activity.javaClass.simpleName}")
    }

    override fun onActivityStarted(activity: Activity) {
        Log.d(TAG, "Native: Listener - onActivityStarted: ${activity.javaClass.simpleName}")
    }

    override fun onActivityResumed(activity: Activity) {
        val resumeStartTime = SystemClock.uptimeMillis() // Start time of onActivityResumed
        Log.d(TAG, "Native: Listener - onActivityResumed: ${activity.javaClass.simpleName} - START ($resumeStartTime ms)")

        if (!hasBeenInitiallyResumed) {
            hasBeenInitiallyResumed = true
        } else if (didEnterBackgroundSinceLastActive) {
            val startupType: String
            val timeInBackgroundMs = resumeStartTime - appBackgroundEnterTime
            val warmThresholdMs = 5000L

            startupType = if (timeInBackgroundMs > warmThresholdMs) {
                "warm"
            } else {
                "hot"
            }

            // --- Place any other significant native work that happens on resume here ---
            // For example, if you have native code that needs to run on resume, put it above this line.

            // --- Move activationDurationMs calculation to the end of the method's logic ---
            val activationDurationMs = SystemClock.uptimeMillis() - resumeStartTime // Calculate END time here

            StartupInfoModule.setStartupInfo(
                startupType,
                activationDurationMs / 1000.0,
                resumeStartTime / 1000.0,
                timeInBackgroundMs / 1000.0
            )
        }

        // Reset flags for the next cycle, always executed on resume
        didEnterBackgroundSinceLastActive = false
        appBackgroundEnterTime = 0
        Log.d(TAG, "Native: Listener - onActivityResumed - END ($resumeStartTime ms)") // Log end of method
    }

    override fun onActivityPaused(activity: Activity) {
        Log.d(TAG, "Native: Listener - onActivityPaused: ${activity.javaClass.simpleName}")
    }

    override fun onActivityStopped(activity: Activity) {
        Log.d(TAG, "Native: Listener - onActivityStopped: ${activity.javaClass.simpleName}")
        appBackgroundEnterTime = SystemClock.uptimeMillis()
        didEnterBackgroundSinceLastActive = true
    }

    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {
        Log.d(TAG, "Native: Listener - onActivitySaveInstanceState: ${activity.javaClass.simpleName}")
    }

    override fun onActivityDestroyed(activity: Activity) {
        Log.d(TAG, "Native: Listener - onActivityDestroyed: ${activity.javaClass.simpleName}")
    }
}