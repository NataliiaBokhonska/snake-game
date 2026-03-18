FROM nginx:1.25-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy game files
COPY index.html /usr/share/nginx/html/
COPY game.js    /usr/share/nginx/html/
COPY style.css  /usr/share/nginx/html/

EXPOSE 80
