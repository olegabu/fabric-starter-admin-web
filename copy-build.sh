#!/usr/bin/env bash


docker cp favicon.ico api.org1.example.com:/usr/src/app/webapp/favicon.ico
docker cp images/ api.org1.example.com:/usr/src/app/webapp/images
docker cp index.html api.org1.example.com:/usr/src/app/webapp/index.html
docker cp scripts/ api.org1.example.com:/usr/src/app/webapp/scripts
docker cp locales/ api.org1.example.com:/usr/src/app/webapp/locales


docker cp favicon.ico api.org2.example.com:/usr/src/app/webapp/favicon.ico
docker cp images/ api.org2.example.com:/usr/src/app/webapp/images
docker cp index.html api.org2.example.com:/usr/src/app/webapp/index.html
docker cp scripts/ api.org2.example.com:/usr/src/app/webapp/scripts
docker cp locales/ api.org2.example.com:/usr/src/app/webapp/locales

