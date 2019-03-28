# Build
FROM node:11-alpine as build
WORKDIR /build
COPY src /build/src
COPY tools /build/tools
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
RUN npm install -g typescript ts-node
RUN npm install 
RUN npm run tsc && npm run copy-assets

# Deploy (without devDependencies)
FROM node:11-alpine as deploy
WORKDIR /build

# Install openjdk 8 (see https://github.com/docker-library/openjdk/blob/master/8/jdk/alpine/Dockerfile)
ENV JAVA_HOME /usr/lib/jvm/java-1.8-openjdk
ENV PATH $PATH:/usr/lib/jvm/java-1.8-openjdk/jre/bin:/usr/lib/jvm/java-1.8-openjdk/bin

ENV JAVA_VERSION 8u201
ENV JAVA_ALPINE_VERSION 8.201.08-r0

RUN apk add --no-cache openjdk8=8.201.08-r0
RUN apk add --no-cache so:libnss3.so

# Install emberjs
RUN npm install -g ember-cli

# Install git
RUN apk add --no-cache git

# Copy files from build
COPY package.json .
RUN npm install --production
COPY --from=build /build/build /build
COPY static static
# Avoid generating a config.json file
ENV BUILDSERVICE_NOCONFIG=true 
CMD ["node", "server.js"]