#!/bin/bash
# set -e

cd $(dirname "$0")
mkdir -p estuary_logs
DATE=$(date "+%Y_%m_%d")

yarn estuary 2>&1 | tee -a estuary_logs/logs_$DATE.txt
