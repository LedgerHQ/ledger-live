package com.ledger.live;

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class BackgroundService : HeadlessJsTaskService() {
    override fun getTaskConfig(intent: Intent): HeadlessJsTaskConfig? {
        val extras = intent.extras
        return if (extras != null) {
            HeadlessJsTaskConfig(
                    "BackgroundRunnerService",
                    Arguments.fromBundle(extras),
                    600000,  // timeout for the task
                    true // optional: defines whether or not  the task is allowed in foreground. Default is false
            )
        } else {
            return null;
        }
    }
}