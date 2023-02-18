FROM node:16

WORKDIR /app

COPY package*.json ./
COPY scripts/*.js ./scripts/
COPY src/*.js ./src/
COPY src/middleware/*.js ./src/middleware/

RUN npm run clean
RUN npm ci --production
RUN npm install -g nodemon
RUN npm run seed

EXPOSE 3001

CMD [ "npm", "start" ]
