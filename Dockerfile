ARG PACKAGE_NAME=admin-webapp.tgz
ARG BASE_IMAGE=node:8-alpine

FROM ${BASE_IMAGE} as node_base
ARG PACKAGE_NAME
#use https:// instead of git@ to speed up in node 8
RUN apk update && apk add git && \
    git config --global url."https://github.com/".insteadOf git@github.com: && \
    git config --global url."https://".insteadOf git://

WORKDIR ./BUILD
COPY . .

RUN rm -f ${PACKAGE_NAME} && \
    npm install && \
    npx au build --env prod && \
    tar -zcvf ${PACKAGE_NAME} index.html scripts

# use --target=export-stage just to export PACKAGE_NAME
FROM scratch AS export-stage
ARG PACKAGE_NAME
COPY --from=node_base /BUILD/${PACKAGE_NAME} /

FROM ${BASE_IMAGE} AS build-stage
WORKDIR ./webapp
COPY --from=node_base /BUILD/scripts ./scripts
COPY --from=node_base /BUILD/index.html ./
