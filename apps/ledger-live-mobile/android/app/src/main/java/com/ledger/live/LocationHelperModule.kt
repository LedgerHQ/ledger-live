package com.ledger.live;

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.LocationSettingsRequest
import com.google.android.gms.location.Priority
import com.ledger.live.Constants.REQUEST_ENABLE_LOCATION
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlin.time.Duration.Companion.seconds

/**
 * Android Native module that provides:
 * - a method to check and enable if necessary the location service
 * - a method to listen to the state (enabled/disabled) of the location service
 *
 * Context: on Android versions <= 11, in order to scan BLE devices, the location service must be enabled.
 *
 * See from https://developers.google.com/android/reference/com/google/android/gms/location/package-summary :
 * - SettingsClient which provides a way to interact with the location settings-enabler APIs
 */
class LocationHelperModule(
    private val reactContext: ReactApplicationContext, coroutineDispatcher: CoroutineDispatcher
) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private val coroutineScope = CoroutineScope(coroutineDispatcher)

    // Resolves with a success or error value. reject is not used because we want to pass an
    // information to the JS code.
    private var checkAndRequestLocationPromise: Promise? = null

    private var listenerCount = 0

    private var checkIfServiceIsEnabledJob: Job? = null;

    /**
     * LocationRequest used by both LocationSettings and FusedLocationProviderClient.
     * We use PRIORITY_PASSIVE to ensure no extra energy usage, we just need the service to be enabled.
     */
    private val locationRequest: LocationRequest =
        LocationRequest.Builder(Priority.PRIORITY_LOW_POWER, 10.seconds.inWholeMilliseconds).build()

    /**
     * Listens to result from the location enable request activity.
     * Request sent from checkAndRequestEnablingLocationServices.
     */
    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?
        ) {
            if (requestCode == REQUEST_ENABLE_LOCATION) {
                when (resultCode) {
                    Activity.RESULT_OK -> {
                        checkAndRequestLocationPromise?.resolve(SUCCESS_LOCATION_ENABLED);
                    }

                    Activity.RESULT_CANCELED -> {
                        checkAndRequestLocationPromise?.resolve(ERROR_USER_DENIED_LOCATION);
                    }
                }
                checkAndRequestLocationPromise = null;
                return
            }
            super.onActivityResult(activity, requestCode, resultCode, data)
        }
    }

    init {
        // Registers the activity listener through reactContext
        reactContext.addActivityEventListener(activityEventListener)
        reactContext.addLifecycleEventListener(this)
    }

    /**
     * The native module can be accessed in JS:
     * ```
     * const { LocationHelperModule } = ReactNative.NativeModules;
     * ```
     */
    override fun getName(): String {
        return "LocationHelperModule"
    }

    override fun onHostDestroy() {
        if (checkIfServiceIsEnabledJob != null) {
            checkIfServiceIsEnabledJob?.cancel()
            checkIfServiceIsEnabledJob = null
        }
    }

    override fun onHostPause() {}

    override fun onHostResume() {}

    internal sealed class CheckLocationServicesResult {
        data object Enabled : CheckLocationServicesResult()
        data class Disabled(
            val exception: java.lang.Exception
        ) : CheckLocationServicesResult()
    }

    private suspend fun checkLocationServicesEnabled(): CheckLocationServicesResult {
        return try {
            val locationSettingsRequest =
                LocationSettingsRequest.Builder().addLocationRequest(locationRequest)
                    .setNeedBle(true).build()

            val task = LocationServices.getSettingsClient(reactContext)
                .checkLocationSettings(locationSettingsRequest)

            val res = task.await()
            if (res.locationSettingsStates?.isBleUsable == true) {
                CheckLocationServicesResult.Enabled
            } else {
                CheckLocationServicesResult.Disabled(exception = Exception("BLE not usable"))
            }
        } catch (e: Exception) {
            CheckLocationServicesResult.Disabled(exception = e)
        }
    }

    /**
     * Checks if the location services are enabled using SettingsClient
     * If the services are not enabled, tries to request the user to enable the services.
     * The result from this request is listened by onActivityResult
     */
    @ReactMethod
    fun checkAndRequestEnablingLocationServices(promise: Promise) {
        Log.d("LocationHelperModule", "Checking and requesting enabling location services")
        checkAndRequestLocationPromise = promise;

        coroutineScope.launch {
            when (val locationServicesEnabled = checkLocationServicesEnabled()) {
                is CheckLocationServicesResult.Enabled -> {
                    Log.d("LocationHelperModule", "Location service already enabled")
                    checkAndRequestLocationPromise?.resolve(SUCCESS_LOCATION_ALREADY_ENABLED);
                    checkAndRequestLocationPromise = null;
                }

                is CheckLocationServicesResult.Disabled -> {
                    val (exception) = locationServicesEnabled
                    if (exception is ResolvableApiException) {
                        // Location settings are not satisfied, but this can be fixed by showing the user a prompt
                        Log.d(
                            "LocationHelperModule",
                            "Location services not enabled. Trying to enable them ..."
                        )
                        val activity = reactContext.currentActivity

                        if (activity == null) {
                            checkAndRequestLocationPromise?.resolve(ERROR_ACTIVITY_DOES_NOT_EXIST);
                            checkAndRequestLocationPromise = null;
                        } else {
                            Log.d(
                                "LocationHelperModule",
                                "Displaying the user a prompt to enable their location"
                            )
                            exception.startResolutionForResult(activity, REQUEST_ENABLE_LOCATION)
                        }
                    } else {
                        Log.d(
                            "LocationHelperModule",
                            "An unknown error happened while trying to request the user to enable their location services: $exception"
                        )
                        checkAndRequestLocationPromise?.resolve(ERROR_UNKNOWN);
                        checkAndRequestLocationPromise = null;
                    }
                }
            }
        }
    }

    private fun emitLocationServiceAvailable(available: Boolean) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("LocationServiceUpdated", Arguments.createMap().apply {
                putString("service", if (available) "enabled" else "disabled")
            })
    }

    /**
     * Enables JS to register a listener to receive events.
     * Then on the JS side, the listen can be set up like this:
     * ```
     * const eventEmitter = new NativeEventEmitter(
     *      NativeModules.LocationHelperModule,
     *    );
     *    const eventListener = eventEmitter.addListener(
     *      "LocationServiceUpdated",
     *      event => {
     *        // Do whatever
     *      },
     *    );
     * ```
     * Signature to respect to add a listener, the eventName param is necessary
     *
     * The listener will receive events from the FusedLocationProviderClient about the
     * state of the locations services.
     */
    @ReactMethod
    fun addListener(eventName: String) {
        // On a first listener, starts listening to location services updates
        if (listenerCount == 0) {
            if (ActivityCompat.checkSelfPermission(
                    reactContext, Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(
                    reactContext, Manifest.permission.ACCESS_COARSE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                checkAndRequestLocationPromise?.resolve(ERROR_LOCATION_PERMISSIONS_NEEDED);
                checkAndRequestLocationPromise = null;
                return
            }

            Log.d("LocationHelperModule", "Starts listening to location services updates")
            checkIfServiceIsEnabledJob = coroutineScope.launch {
                while (true) {
                    val locationServicesEnabled = checkLocationServicesEnabled()
                    if (locationServicesEnabled is CheckLocationServicesResult.Enabled) {
                        emitLocationServiceAvailable(true)
                    } else if (locationServicesEnabled is CheckLocationServicesResult.Disabled) {
                        emitLocationServiceAvailable(false)
                    }
                    delay(1.seconds)
                }
            }
        }

        listenerCount += 1
    }

    /**
     * Signature to respect to allow JS to remove several listeners
     * See addListener above
     */
    @ReactMethod
    fun removeListeners(count: Int) {
        listenerCount -= count
        if (listenerCount == 0) {
            Log.d("LocationHelperModule", "Stops listening to location services updates")
            if (checkIfServiceIsEnabledJob != null) {
                checkIfServiceIsEnabledJob?.cancel()
                checkIfServiceIsEnabledJob = null
            }
        }
    }

    // Represents the values returned (resolved) by the promise to JS
    companion object {
        const val SUCCESS_LOCATION_ALREADY_ENABLED = "SUCCESS_LOCATION_ALREADY_ENABLED"
        const val SUCCESS_LOCATION_ENABLED = "SUCCESS_LOCATION_ENABLED"
        const val ERROR_ACTIVITY_DOES_NOT_EXIST = "ERROR_ACTIVITY_DOES_NOT_EXIST"
        const val ERROR_USER_DENIED_LOCATION = "ERROR_USER_DENIED_LOCATION"
        const val ERROR_LOCATION_PERMISSIONS_NEEDED = "ERROR_LOCATION_PERMISSIONS_NEEDED"
        const val ERROR_UNKNOWN = "ERROR_UNKNOWN"
    }
}
