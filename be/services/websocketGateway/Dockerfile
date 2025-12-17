FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port 5005
EXPOSE 5005

# Use gunicorn with gevent worker for production-ready SocketIO support
CMD ["gunicorn", "-k", "gevent", "-w", "1", "-b", "0.0.0.0:5005", "main:app"]
