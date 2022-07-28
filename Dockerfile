FROM node:8-alpine as node_base
RUN apk update && apk add git

#use https:// instead of git@ to speed up in node 8
RUN git config --global url."https://github.com/".insteadOf git@github.com:
RUN git config --global url."https://".insteadOf git://

ENV BUILD_DIR=./BUILD

WORKDIR ${BUILD_DIR}
COPY . .

ARG PACKAGE_NAME
RUN rm -f ${PACKAGE_NAME:-admin-webapp.tgz}

RUN npm install
RUN npx au build --env prod

RUN tar -zcvf ${PACKAGE_NAME:-admin-webapp.tgz} index.html scripts

FROM scratch AS export-stage
ARG PACKAGE_NAME
COPY --from=node_base /BUILD/${PACKAGE_NAME:-admin-webapp.tgz} /
