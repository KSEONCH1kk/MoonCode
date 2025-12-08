# Docker Sandbox Setup

## Requirements

- Docker Desktop (Windows) or Docker Engine (Linux)
- Docker must be running

## Building the Image

The Docker image will be built automatically on first use, or you can build it manually:

```bash
cd server/docker
docker build -t code-sandbox:latest .
```

## Security Features

- **Resource Limits**: CPU (1 core), Memory (256-512MB per language)
- **Network Isolation**: No network access (`--network=none`)
- **Read-only Filesystem**: Container runs with read-only root filesystem
- **Temporary Filesystems**: `/tmp` and `/app` are tmpfs (in-memory)
- **Capability Dropping**: All capabilities dropped except minimal required ones
- **No Privilege Escalation**: `no-new-privileges:true`
- **Auto-cleanup**: Containers are automatically removed after execution

## Supported Languages

- Java (OpenJDK 17)
- Python 3
- Node.js (JavaScript/TypeScript)
- C/C++ (GCC)
- Go
- Rust
- Kotlin
- C# (Mono)
- PHP
- Ruby

## Troubleshooting

### Docker not found
- Windows: Install Docker Desktop from https://www.docker.com/products/docker-desktop
- Linux: Install Docker Engine: `sudo apt-get install docker.io`

### Image build fails
- Check Docker is running: `docker ps`
- Check disk space: `docker system df`
- Try building manually: `cd server/docker && docker build -t code-sandbox:latest .`

### Execution timeout
- Default timeout is 10 seconds (configurable per language)
- Increase timeout in `LANGUAGES` config if needed

### Memory issues
- Default memory limit is 256MB
- Increase in `LANGUAGES` config for languages that need more (e.g., Kotlin: 512MB)

