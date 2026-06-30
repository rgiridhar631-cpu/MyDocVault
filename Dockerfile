# Base Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy remaining code files
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
