# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (needed for some python packages)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port (default Flask port, but we'll configure it)
EXPOSE 5001

# Command to run the application using Gunicorn
# Make startup script executable
RUN chmod +x start.sh

# Set Flask app environment variable
ENV FLASK_APP=main.py

CMD ["./start.sh"]
