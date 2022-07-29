FROM node:8-alpine as node_base
ARG PACKAGE_NAME

#use https:// instead of git@ to speed up in node 8
RUN apk update && apk add git && \
    git config --global url."https://github.com/".insteadOf git@github.com: && \
    git config --global url."https://".insteadOf git://

ENV BUILD_DIR=./BUILD
WORKDIR ${BUILD_DIR}
COPY . .

RUN rm -f ${PACKAGE_NAME:-admin-webapp.tgz} && \
    npm install && \
    npx au build --env prod && \
    tar -zcvf ${PACKAGE_NAME:-admin-webapp.tgz} index.html scripts

FROM scratch AS export-stage
ARG PACKAGE_NAME

COPY --from=node_base /BUILD/${PACKAGE_NAME:-admin-webapp.tgz} /
