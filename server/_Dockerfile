# api-server
FROM node:8
RUN mkdir /app
RUN chmod 777 /app
WORKDIR /app
EXPOSE 2018

COPY ./Hongkong /etc/localtime
RUN npm set registry https://registry.npm.taobao.org
RUN npm i -g pm2
ENV DB_HOST=api-db
COPY ./ /app
ENTRYPOINT pm2 start --name api-server ./dist/app.js && bash