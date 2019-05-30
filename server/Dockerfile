# api-server
FROM node:8
RUN mkdir /app
RUN chmod 777 /app
WORKDIR /app
VOLUME ["/app"]
EXPOSE 2018
COPY ./Hongkong /etc/localtime
RUN npm set registry https://registry.npm.taobao.org
RUN yarn global add pm2
COPY ./template /app/template
COPY ./node_modules /app/node_modules
COPY ./dist /app
ENTRYPOINT pm2-docker start ./app.js