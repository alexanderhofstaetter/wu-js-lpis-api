#!/bin/bash

# Alexander Hofstätter 
# https://github.com/alexanderhofstaetter/
# 
# usage: ./start.sh <time> <offset> <script>
# e.g.:  ./start.sh 14:00:00 3 <script>
 
if [[ $(/usr/bin/id -u) -ne 0 ]]; then
    echo "Not running as root"
    exit
fi

time=$1
offset=$2
timeserver="timeserver.wu.ac.at"

declare -i trigger
declare -i trigger_init
# start=$(date -d '$time' +"%s")
start=$(date -j -f "%T" "$time" "+%s")
trigger=$start-$offset
trigger_init=$start-60

# Sync Time with NTP
echo "updating time from $timeserver"
sudo ntpdate -u $timeserver

echo "current time: $(date +'%H:%M:%S') ($(date +"%s"))"
echo "start   time: $time"
echo "offset  time: $offset seconds"
echo "trigger time: $(date -j -f "%s" "$trigger" "+%H:%M:%S") ($trigger)"

echo "waiting to reach execution time ..."

while [[ $(date +"%s") < $trigger ]]
do
	sleep 1
	echo "It is: $(date +"%H:%M:%S"), waiting till $(date -j -f "%s" "$trigger" "+%H:%M:%S")"
done 

echo "starting executing of script \"$4\" with casperjs"

"${@:3}"