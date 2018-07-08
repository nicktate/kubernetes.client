FROM mhart/alpine-node:8.9.3

MAINTAINER Containership Developers <developers@containership.io>

WORKDIR /app

# install node modules separately for pre-cache
ADD package.json .
ADD yarn.lock .
RUN yarn install --ignore-engines --pure-lockfile

# create /app and add files, node_modules is ignored in .dockerignore
ADD . .

# set default NODE_ENV=production
ENV NODE_ENV production

CMD ["node", "index.js"]
