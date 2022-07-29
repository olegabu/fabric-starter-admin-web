#!/usr/bin/env bash

copyToDir=${1}

PACKAGE_NAME=${PACKAGE_NAME:-admin-webapp.tgz}
rm -f ${packageName}

DOCKER_BUILDKIT=1 \
docker build \
--build-arg PACKAGE_NAME=${PACKAGE_NAME} \
--no-cache --progress=plain --output ./ .

if [ ! -z "$copyToDir" ]; then
  cp -v ${PACKAGE_NAME} ${copyToDir}
fi
