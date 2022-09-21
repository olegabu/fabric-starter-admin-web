#!/usr/bin/env bash

copyToDir=${1}

PACKAGE_NAME=${PACKAGE_NAME:-admin-webapp.tgz}
rm -rf ./scripts

DOCKER_BUILDKIT=1 \
docker build \
--build-arg PACKAGE_NAME=${PACKAGE_NAME} \
--no-cache --progress=plain --output ./ .

rm -f ${PACKAGE_NAME}
tar -zcvf ${PACKAGE_NAME} index.html scripts

if [ -n "$copyToDir" ]; then
  cp -v ${PACKAGE_NAME} ${copyToDir}
fi
