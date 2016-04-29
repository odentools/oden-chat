FROM node:5-wheezy
MAINTAINER OECU VMLab

ADD . /

RUN npm install --production

EXPOSE 8080
ENTRYPOINT ["npm", "start"]
