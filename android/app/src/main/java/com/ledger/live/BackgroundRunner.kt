package com.ledger.live;

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod


/**
 * This class is in charge of receiving the call from react-native side and in turn calling a
 * headlessJS service that will run our code in the background. We could potentially launch some
 * UI helpers such as notifications from here, and have the headlessJS talk back to us with more
 * exposed methods.
 */
class BackgroundRunner(var context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName(): String {
        return "BackgroundRunner"
    }

    /**
     * Refactor this eye-sore into something cleaner someday.
     */
    private fun createOrUpdateNotification(progress: Int, message: String) {
        val intent = Intent(context, MainActivity::class.java)
        intent.addCategory(Intent.CATEGORY_LAUNCHER)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
        val pendingIntent: PendingIntent = PendingIntent.getActivity(context, 0, intent, 0)

        val requiresUserInput = message !== "";
        var builder = NotificationCompat.Builder(context, if (requiresUserInput) {
            MainApplication.HI_NOTIFICATION_CHANNEL
        } else {
            MainApplication.LO_NOTIFICATION_CHANNEL
        })
                .setPriority(if (requiresUserInput) {
                    NotificationCompat.PRIORITY_HIGH
                } else {
                    NotificationCompat.PRIORITY_DEFAULT
                })
                .setContentText(when {
                    requiresUserInput -> {
                        "We require your confirmation on the device"
                    }
                    progress == 0 -> {
                        "Transferring update, we will notify you when we're done"
                    }
                    else -> {
                        "Installing $progress%"
                    }
                })
                .setOnlyAlertOnce(!requiresUserInput)
                .setSmallIcon(R.drawable.ic_stat_group)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setAutoCancel(false)

        if (!requiresUserInput) {
            // Conditionally make it a progress thing
            builder = builder.setProgress(100, progress, progress == 0 || requiresUserInput)
        }

        with(NotificationManagerCompat.from(context)) {
            // notificationId is a unique int for each notification that you must define
            notify(if (requiresUserInput) {
                MainApplication.FW_UPDATE_NOTIFICATION_USER
            } else {
                MainApplication.FW_UPDATE_NOTIFICATION_PROGRESS
            }, builder.build())
        }
    }

    @ReactMethod
    fun start(deviceId: String?, firmwareSerializedJson: String?) {
        createOrUpdateNotification(0, "");
        HeadlessJsTaskService.acquireWakeLockNow(context)
        val service = Intent(context, BackgroundService::class.java)
        service.putExtra("deviceId", deviceId)
        service.putExtra("firmwareSerializedJson", firmwareSerializedJson)

        context.startService(service)
    }

    @ReactMethod
    fun update(progress: Int) {
        createOrUpdateNotification(progress, "");
    }

    @ReactMethod
    fun requireUserAction(message: String) {
        createOrUpdateNotification(0, message);
    }

    @ReactMethod
    fun stop() {
        with(NotificationManagerCompat.from(context)) {
            cancelAll();
        }
    }
}