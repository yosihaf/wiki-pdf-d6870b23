export default function DockerComposeDevContent() {
  const content = `version: '3.8'

services:
  wikipdf-app-dev:
    build: 
      context: ../..
      dockerfile: components/docker/Dockerfile.dev
    container_name: wikipdf-app-dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
    volumes:
      - ../../:/app
      - /app/node_modules
    restart: unless-stopped`;

  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
}