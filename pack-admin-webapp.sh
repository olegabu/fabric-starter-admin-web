#!/usr/bin/env bash

packageName=admin-webapp.tgz
rm -f ${packageName}

npm install
npx au build --env prod
echo "Built"

tar -zcvf ${packageName} index.html scripts
echo "Package prepared"

cp -v ${packageName} ../fabric-starter-rest
