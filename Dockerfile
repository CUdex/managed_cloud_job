FROM node:alpine3.19

MAINTAINER cuyu9779 <cuyu9779@gmail.com>
WORKDIR /usr/app
RUN npm install winston winston-daily-rotate-file @aws-sdk/client-ec2

COPY ./*.js /usr/app

ENTRYPOINT ["node","main.js"] 

