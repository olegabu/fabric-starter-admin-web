#!/usr/bin/env bash

copyToDir=${1}

PACKAGE_NAME=${PACKAGE_NAME:-admin-webapp.tgz}
rm -f ${PACKAGE_NAME}

DOCKER_BUILDKIT=1 \
docker build \
--target=export-stage \
--build-arg PACKAGE_NAME=${PACKAGE_NAME} \
--no-cache --progress=plain --output ./ .

if [ -n "$copyToDir" ]; then
  cp -v ${PACKAGE_NAME} ${copyToDir}
fi
