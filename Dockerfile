# Use Node.js 20 as the base image
FROM node:20.16.0 
 

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies, including PM2
RUN yarn install  
# Build the application (if applicable, e.g., for React or TypeScript)
RUN yarn tsc
# Copy the rest of your application code
COPY . .

# Expose the application port
EXPOSE 5000

# Command to run your application using PM2
CMD ["pm2-runtime", "start", "dist/index.js", "--name", "my-app"]  # Change "server.js" to your app's entry point
