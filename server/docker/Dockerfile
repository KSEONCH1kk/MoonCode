# Multi-language code execution sandbox
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    nodejs \
    npm \
    openjdk-17-jdk \
    golang-go \
    gcc \
    g++ \
    php \
    ruby \
    curl \
    wget \
    unzip \
    && npm install -g typescript \
    && cd /tmp \
    && wget -q https://github.com/JetBrains/kotlin/releases/download/v1.9.22/kotlin-compiler-1.9.22.zip \
    && unzip -q kotlin-compiler-1.9.22.zip \
    && mv kotlinc /usr/local/kotlinc \
    && ln -s /usr/local/kotlinc/bin/kotlinc /usr/local/bin/kotlinc \
    && ln -s /usr/local/kotlinc/bin/kotlin /usr/local/bin/kotlin \
    && rm -rf /tmp/* /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 runner && \
    mkdir -p /app && \
    chown -R runner:runner /app

# Set working directory
WORKDIR /app

# Switch to non-root user
USER runner

# Set resource limits (handled by Docker run flags)
# Default timeout
ENV TIMEOUT=10

# Entry point script will be mounted at runtime
CMD ["/bin/bash"]

