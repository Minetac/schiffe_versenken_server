@echo off

call ./node_modules/.bin/tsc.cmd

@REM call node ./dist/index.js
call node ./dist/server.js