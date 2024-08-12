# Dockerfile

# Menggunakan node image sebagai base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh file dari konteks build ke working directory
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port untuk aplikasi
EXPOSE 3001

# Jalankan aplikasi
CMD ["node", "index.js"]
