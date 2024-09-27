ARG node=20.17-slim
ARG nginx=1.26

FROM node:${node} AS yact-builder-node
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt update -y
RUN apt install -y
RUN apt-get clean
WORKDIR /app
COPY *.mjs .
COPY *.json .
COPY *.js .
COPY *.ts .
COPY public public
COPY src src
RUN npm ci
RUN npm run build

FROM nginx:${nginx}
WORKDIR /app
COPY --from=yact-builder-node /app/dist/ /var/www/
COPY conf/docker/nginx/default.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
HEALTHCHECK --interval=60m --timeout=3s CMD curl -f http://localhost/ || exit 1
