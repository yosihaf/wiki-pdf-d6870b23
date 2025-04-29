export default function DockerComposeContent() {
  const content = `version: '3.8'

services:
  wikipdf-app:
    build:
      context: ../..
      dockerfile: components/docker/Dockerfile
    container_name: wikipdf-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    volumes:
      - wikipdf_data:/app/data

volumes:
  wikipdf_data:`;

  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
}