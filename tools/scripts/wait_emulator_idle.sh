#!/bin/bash

# Wait until the device is considered idle

start_time=$(date +%s)
load_threshold=0.9
echo "Start waiting until the device is idle ($(date))"
end_time=$((start_time + 1800))

while true; do
    load=$(adb shell uptime | cut -d , -f 3 | cut -f 2 -d :)

    if (( $(echo "$load > $load_threshold" | bc -l) )); then
        if (( $(echo "$load < 4" | bc -l) )); then
            anr_package=$(adb shell dumpsys window | grep -E "mCurrentFocus.*Application Not Responding" | cut -f 2 -d : | sed -e "s/}//" -e "s/^ *//" | tr -d '\r\n')

            if [ -n "$anr_package" ]; then
                echo "ANR on screen for: $anr_package. Restarting it."

                # Some suggest that restarting the service with 'am startservice' should restart it,
                # but it doesn't seem to work. So using killall.
                # We additionally restart it, but with killall, the system UI is restarted automatically
                adb shell su 0 killall $anr_package

                if [ "$anr_package" == "com.android.systemui" ]; then
                    adb shell am start-service -n com.android.systemui/.SystemUIService || true
                fi
            fi
        fi

        sleep 15
    else
        break
    fi

    if [ $(date +%s) -ge $end_time ]; then
        echo "Reached the timeout before the device is idle."
        break
    fi
done

echo "Waited until the device is idle for $(( $(date +%s) - start_time )) seconds."

