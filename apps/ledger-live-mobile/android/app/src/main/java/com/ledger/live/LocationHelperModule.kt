package com.ledger.live;

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.util.Log

// Native module imports
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

// Location imports
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.*
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat

import com.ledger.live.Constants.REQUEST_ENABLE_LOCATION

/**
 * Android Native module that provides:
 * - a method to check and enable if necessary the location service
 * - a method to listen to the state (enabled/disabled) of the location service
 *
 * See from https://developers.google.com/android/reference/com/google/android/gms/location/package-summary :
 * - SettingsClient which provides a way to interact with the location settings-enabler APIs
 * - FusedLocationProviderClient which provides a way to listen to the location service state updates
 */
class LocationHelperModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    // Resolves with a success or error value. reject is not used because we want to pass an
    // information to the JS code.
    private var locationPromise: Promise? = null

    // LocationRequest used by both LocationSettings and FusedLocationProviderClient
    // LocationRequest.create() is deprecated, but LocationRequest.Builder()
    // is available from `import android.location.LocationRequest` which
    // requires API level >= 31 (current min is 24)
    private var locationRequest: LocationRequest = LocationRequest.create();

    private var fusedLocationProviderClient: FusedLocationProviderClient;

    /**
     * Listens to result from the location enable request activity.
     * Request sent from requestEnableLocation.
     */
    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity?,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            if (requestCode === REQUEST_ENABLE_LOCATION) {
                when (resultCode) {
                    Activity.RESULT_OK -> {
                        locationPromise?.resolve(SUCCESS_LOCATION_ENABLED);
                    }
                    Activity.RESULT_CANCELED -> {
                        locationPromise?.resolve(ERROR_USER_DENIED_LOCATION);
                    }
                }
                locationPromise = null;
                return
            }
            super.onActivityResult(activity, requestCode, resultCode, data)
        }
    }

    /**
     * Handler to listen to location services updates (turned on/off)
     *
     * Emits an event to JS everytime the state of the location services change
     */
    private val locationServicesUpdateCallback = object : LocationCallback() {
        override fun onLocationAvailability(p0: LocationAvailability) {
            val isLocationAvailable = p0.isLocationAvailable

            if (isLocationAvailable) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("LocationServiceUpdated", Arguments.createMap().apply {
                        putString("service", "enabled")
                    })
            } else {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("LocationServiceUpdated", Arguments.createMap().apply {
                        putString("service", "disabled")
                    })
            }
            super.onLocationAvailability(p0)
        }
    }

    init {
        // PRIORITY_HIGH_ACCURACY:  request the most precise location possible.
        // With this setting, the location services are more likely to use GPS to determine the location.
        // The given permissions will also influence the level of precision.
        //
        // LocationRequest.PRIORITY_HIGH_ACCURACY is deprecated
        // but Priority.PRIORITY_HIGH_ACCURACY seems unavailable on API level 24
        locationRequest.priority = LocationRequest.PRIORITY_HIGH_ACCURACY
        // Sets the rate in milliseconds at which our app prefers to receive location updates
        locationRequest.interval = 10000

        // The fused location provider manages the different location services (GPS and Wi-Fi).
        // With a PRIORITY_HIGH_ACCURACY, the provider will choose the GPS, which is needed for BLE scanning.
        fusedLocationProviderClient =
            LocationServices.getFusedLocationProviderClient(reactContext)

        // Registers the activity listener through reactContext
        reactContext.addActivityEventListener(activityEventListener)
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

    /**
     * Checks if the location services are enabled using SettingsClient
     * If the services are not enabled, tries to request the user to enable the services.
     * The result from this request is listened by onActivityResult
     */
    @ReactMethod
    fun checkAndRequestEnablingLocationServices(promise: Promise) {
        Log.d("LocationHelperModule", "Checking and requesting enabling location services")
        locationPromise = promise;

        val locationSettingsRequestBuilder =
            LocationSettingsRequest.Builder().addLocationRequest(locationRequest)
        // locationSettingsRequest.setNeedBle(true) // Could be interesting in the future

        // With SettingsClient, no need to explicitly build and connect to a GoogleApiClient.
        // Checks whether current location settings are satisfied
        val task = LocationServices.getSettingsClient(reactContext)
            .checkLocationSettings(locationSettingsRequestBuilder.build())

        // When the Task completes, the client can check the location settings by looking at
        // the status code from the LocationSettingsResponse object
        task.addOnSuccessListener { locationSettingsResponse ->
            val locationServiceState = locationSettingsResponse.locationSettingsStates;
            Log.d("LocationHelperModule", "Location service already enabled: $locationServiceState")
            locationPromise?.resolve(SUCCESS_LOCATION_ALREADY_ENABLED);
            locationPromise = null;
        }

        task.addOnFailureListener { exception ->
            if (exception is ResolvableApiException) {
                // Location settings are not satisfied, but this can be fixed by showing the user a prompt
                Log.d(
                    "LocationHelperModule",
                    "Location services not enabled. Trying to enable them ..."
                )
                val activity = this.currentActivity

                if (activity == null) {
                    locationPromise?.resolve(ERROR_ACTIVITY_DOES_NOT_EXIST);
                    locationPromise = null;
                } else {
                    Log.d(
                        "LocationHelperModule",
                        "Displaying the user a prompt to enable their location"
                    )
                    exception.startResolutionForResult(activity, REQUEST_ENABLE_LOCATION)
                }
            } else {
                // Not an error due to permissions. Something else happened.
                Log.d(
                    "LocationHelperModule",
                    "An unknown error happened while trying to request the user to enable their location services: $exception"
                )
                locationPromise?.resolve(ERROR_UNKNOWN);
                locationPromise = null;
            }
        }
    }


    private var listenerCount = 0

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
                    reactContext,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
                && ActivityCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                locationPromise?.resolve(ERROR_LOCATION_PERMISSIONS_NEEDED);
                locationPromise = null;
                return
            }

            Log.d("LocationHelperModule", "Starts listening to location services updates")
            fusedLocationProviderClient.requestLocationUpdates(
                locationRequest,
                locationServicesUpdateCallback,
                null
            )
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
            fusedLocationProviderClient.removeLocationUpdates(locationServicesUpdateCallback);
        }
    }

    // Represents the values returned (resolve) by the promise to JS
    companion object {
        const val SUCCESS_LOCATION_ALREADY_ENABLED = "SUCCESS_LOCATION_ALREADY_ENABLED"
        const val SUCCESS_LOCATION_ENABLED = "SUCCESS_LOCATION_ENABLED"
        const val ERROR_ACTIVITY_DOES_NOT_EXIST = "ERROR_ACTIVITY_DOES_NOT_EXIST"
        const val ERROR_USER_DENIED_LOCATION = "ERROR_USER_DENIED_LOCATION"
        const val ERROR_LOCATION_PERMISSIONS_NEEDED = "ERROR_LOCATION_PERMISSIONS_NEEDED"
        const val ERROR_UNKNOWN = "ERROR_UNKNOWN"
    }

    // Not super useful if we want a strong typing in TS. Easier to just copy the value of the
    // Companion object.
    // Exports LocationHelperModule constants to JS
    // override fun getConstants(): Map<String, String> =
    //    Companion::class.members
    //        .filter { it is KProperty1<*, *> && it.isConst }
    //        .associate { it.name to it.name }
}
