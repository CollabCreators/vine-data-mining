#!/usr/bin/env bash
command -v forever >/dev/null 2>&1 || { echo >&2 "Forever not installed, use 'npm install -g forever'. Aborting."; exit 1; }
runArg="${1:-worker}"
if [[ "$runArg" == "router" ]] || [[ "$runArg" == "r" ]]; then runArg="router"
elif [[ "$runArg" == "master" ]] || [[ "$runArg" == "m" ]]; then runArg="master"
elif [[ "$runArg" == "worker" ]] || [[ "$runArg" == "w" ]]; then runArg="worker"; fi
forever start -c "npm start $runArg" ./
