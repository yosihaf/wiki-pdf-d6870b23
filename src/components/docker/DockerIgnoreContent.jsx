export default function DockerIgnoreContent() {
  const content = `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.DS_Store
.vscode
dist
build
.next
out
coverage`;

  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
}