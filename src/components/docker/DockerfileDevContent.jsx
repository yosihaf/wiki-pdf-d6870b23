export default function DockerfileDevContent() {
  const content = `FROM node:18-alpine

WORKDIR /app

# התקנת dependencies
COPY package.json package-lock.json* ./
RUN npm install

# העתקת קוד המקור
COPY . .

# חשיפת פורט
EXPOSE 3000

# הרצת בסביבת פיתוח
CMD ["npm", "run", "dev"]`;

  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
}