#!/usr/bin/env bash
command -v forever >/dev/null 2>&1 || { echo >&2 "Forever not installed, use 'npm install -g forever'. Aborting."; exit 1; }
runArg=""
if [[ "$1" == "router" ]] || [[ "$1" == "r" ]]; then runArg="router"
elif [[ "$1" == "master" ]] || [[ "$1" == "m" ]]; then runArg="master"
elif [[ "$1" == "worker" ]] || [[ "$1" == "w" ]]; then runArg="worker"; fi
forever start -c "npm start $runArg" ./
