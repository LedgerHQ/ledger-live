#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

echo -e "${YELLOW}[$(timestamp)] Starting application...${NC}"
pnpm start &

sleep 10

APP_NAME="com.ledger.live"
SIMULATOR_ID=$(xcrun simctl list | grep -m 1 '(Booted)' | awk '{print $NF}' | tr -d '()')
PID=$(xcrun simctl spawn $SIMULATOR_ID launchctl list | grep $APP_NAME | awk '{print $1}')

if [ -z "$PID" ]; then
  echo -e "${RED}[$(timestamp)] Failed to find the process ID of the app. Exiting.${NC}"
  exit 1
fi

REPORT_FILE="performance_report.log"
echo -e "${YELLOW}[$(timestamp)] Logging performance metrics to ${REPORT_FILE}${NC}"
echo "Performance Report - $(timestamp)" > $REPORT_FILE

log_memory_usage() {
  echo -e "${YELLOW}[$(timestamp)] Logging memory usage...${NC}"
  echo "[$(timestamp)] Memory Usage:" >> $REPORT_FILE
  ps -p $PID -o %mem,rss >> $REPORT_FILE
}

log_cpu_usage() {
  echo -e "${YELLOW}[$(timestamp)] Logging CPU usage...${NC}"
  echo "[$(timestamp)] CPU Usage:" >> $REPORT_FILE
  ps -p $PID -o %cpu >> $REPORT_FILE
}

#log_network_activity() {
# echo -e "${YELLOW}[$(timestamp)] Logging network activity...${NC}"
#  echo "[$(timestamp)] Network Activity:" >> $REPORT_FILE
#  netstat -an >> $REPORT_FILE
#}

log_memory_leaks() {
  echo -e "${YELLOW}[$(timestamp)] Checking for memory leaks...${NC}"
  echo "[$(timestamp)] Memory Leaks:" >> $REPORT_FILE
  leaks $PID >> $REPORT_FILE
}

while ps -p $PID > /dev/null
do
  echo -e "\n==================== Report at $(timestamp) ====================" >> $REPORT_FILE
  log_memory_usage
  log_cpu_usage
#  log_network_activity
  log_memory_leaks
  echo -e "${GREEN}[$(timestamp)] Performance metrics logged.${NC}"
  sleep 10 # check every 10 seconds
done

echo -e "${RED}[$(timestamp)] Application process not found. Exiting.${NC}"
echo "[$(timestamp)] Application process not found. Exiting." >> $REPORT_FILE
