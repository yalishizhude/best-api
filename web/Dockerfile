FROM nginx:1.12-alpine
COPY ./Hongkong /etc/localtime
COPY ./nginx.conf /etc/nginx/conf.d
COPY ./dist /usr/share/nginx/html
ENTRYPOINT nginx -g 'daemon off;'