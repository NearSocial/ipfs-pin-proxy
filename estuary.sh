#!/bin/bash
# set -e

cd $(dirname "$0")
mkdir -p estuary_logs

while :
do
  DATE=$(date "+%Y_%m_%d")
  date | tee -a estuary_logs/logs_$DATE.txt
  yarn estuary 2>&1 | tee -a estuary_logs/logs_$DATE.txt
  sleep 5
done
