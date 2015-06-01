#!/usr/bin/env bash
runArg="${1:-worker}"
if [[ "$runArg" == "router" ]] || [[ "$runArg" == "r" ]]; then runArg="router"
elif [[ "$runArg" == "master" ]] || [[ "$runArg" == "m" ]]; then runArg="master"
elif [[ "$runArg" == "worker" ]] || [[ "$runArg" == "w" ]]; then runArg="worker"; fi

if type forever >/dev/null; then
  forever start -c "npm start $runArg" ./
elif type /usr/local/bin/forever >/dev/null; then
  /usr/local/bin/forever start -c "npm start $runArg" ./
else
  echo >&2 "Forever not installed, use 'npm install -g forever'. Aborting."
  exit 1
fi
