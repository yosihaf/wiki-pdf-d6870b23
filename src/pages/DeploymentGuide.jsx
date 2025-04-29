
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Server, FileCode, Download, ExternalLink, Terminal, Database, Box } from "lucide-react";
import { useAuth } from '../components/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// הקומפוננטות של Docker
const DockerfileContent = () => {
  const content = `FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production image
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy built app
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package*.json ./
COPY --from=base /app/next.config.js ./
COPY --from=base /app/next-i18next.config.js ./

# Install production dependencies
RUN npm install --only=production

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
`; // תוכן ה-Dockerfile
  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
};

const DockerComposeContent = () => {
  const content = `version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: always
`; // תוכן ה-docker-compose
  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
};

const DockerComposeDevContent = () => {
  const content = `version: '3.8'
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    restart: always
`; // תוכן ה-docker-compose.dev
  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
};

const DockerfileDevContent = () => {
  const content = `FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the app in development mode
CMD ["npm", "run", "dev"]
`; // תוכן ה-Dockerfile.dev
  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
};

const DockerIgnoreContent = () => {
  const content = `node_modules
.next
`; // תוכן ה-.dockerignore
  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
};

const DockerReadmeContent = () => {
  const content = `# הרצת WikiPDF ב-Docker

1. ודא שמותקן לך Docker ו-Docker Compose.
2. בתיקייה השורשית של הפרויקט, הפעל:

   \`\`\`bash
   docker-compose up --build
   \`\`\`

3. האפליקציה תהיה זמינה בכתובת \`http://localhost:3000\`.

## הרצת סביבת פיתוח

עבור סביבת פיתוח, השתמש בקובץ \`docker-compose.dev.yml\`:

\`\`\`bash
docker-compose -f docker-compose.dev.yml up --build
\`\`\`

זה יאפשר לך לערוך את הקוד ולראות את השינויים באופן מיידי.
`; // תוכן ה-README
  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
};

const NginxConfig = () => {
  const content = `server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;
  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
};

export default function DeploymentGuide() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const { currentUser } = useAuth();

  React.useEffect(() => {
    const checkAdmin = async () => {
      setIsAdmin(currentUser?.role === 'admin');
    };
    checkAdmin();
  }, [currentUser]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-2xl font-bold">
                גישה מוגבלת
              </CardTitle>
              <CardDescription>
                רק מנהלי מערכת יכולים לצפות בדף זה
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Server className="w-6 h-6 text-blue-600" />
                מדריך הפצה והרצה של האפליקציה
              </CardTitle>
              <CardDescription>
                הוראות מפורטות להפצת האפליקציה בדוקר או בשרת
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="docker" className="mb-8">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="docker" className="flex items-center gap-2 py-2">
                    <Box className="w-5 h-5" />
                    <span>הרצה ב-Docker</span>
                  </TabsTrigger>
                  <TabsTrigger value="server" className="flex items-center gap-2 py-2">
                    <Server className="w-5 h-5" />
                    <span>הרצה בשרת</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="docker" className="space-y-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <Box className="w-5 h-5" />
                      הרצת האפליקציה בדוקר
                    </h3>
                    <p className="text-blue-800">
                      כדי להריץ את האפליקציה בדוקר, צור את הקבצים הבאים בפרויקט שלך ועקוב אחר ההוראות:
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <FileCode className="w-5 h-5" />
                        קבצי הגדרה
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-1">Dockerfile (סביבת ייצור)</h4>
                          <DockerfileContent />
                        </div>

                        <div>
                          <h4 className="font-semibold mb-1">docker-compose.yml</h4>
                          <DockerComposeContent />
                        </div>

                        <div>
                          <h4 className="font-semibold mb-1">Dockerfile.dev (סביבת פיתוח)</h4>
                          <DockerfileDevContent />
                        </div>

                        <div>
                          <h4 className="font-semibold mb-1">docker-compose.dev.yml</h4>
                          <DockerComposeDevContent />
                        </div>

                        <div>
                          <h4 className="font-semibold mb-1">.dockerignore</h4>
                          <DockerIgnoreContent />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Terminal className="w-5 h-5" />
                        הוראות הפעלה
                      </h3>
                      <DockerReadmeContent />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="server" className="space-y-8">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      הרצת האפליקציה בשרת
                    </h3>
                    <p className="text-green-800">
                      כדי להריץ את האפליקציה בשרת, עקוב אחר ההוראות הבאות:
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold mb-2">1. הורדת קוד המקור</h3>
                      <p className="mb-4">
                        הורד את קוד המקור של האפליקציה מה-workspace:
                      </p>
                      <div className="flex justify-center mb-4">
                        <Button variant="outline" className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          הורד את קוד המקור
                        </Button>
                      </div>
                      <p>
                        לחלופין, התחבר ל-workspace של base44 והורד את הקוד משם.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-2">2. הגדרת Node.js</h3>
                      <p className="mb-2">
                        וודא שיש לך Node.js בגרסה 18 ומעלה מותקן על השרת:
                      </p>
                      <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto mb-4">
                        {`# בדיקת גרסת Node.js
node -v

# אם צריך להתקין או לשדרג:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs`}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-2">3. הגדרת קובץ הסביבה</h3>
                      <p className="mb-2">
                        צור קובץ <code>.env</code> בתיקיית הפרויקט:
                      </p>
                      <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto mb-4">
                        {`# הגדרות בסיסיות
PORT=3000
BASE44_API_KEY=your_api_key
BASE44_APP_ID=your_app_id

# הגדרת כתובת ה-API של השרת שלך
WIKI_PDF_API_URL=https://pdf.your-domain.com`}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-2">4. התקנה והרצה</h3>
                      <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto mb-4">
                        {`# התקנת dependencies
npm install

# בנייה לייצור
npm run build

# הרצת השרת
npm start`}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-2">5. הגדרת Nginx</h3>
                      <NginxConfig />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-2">6. הרצה כשירות מערכת</h3>
                      <p className="mb-2">
                        צור קובץ שירות systemd:
                      </p>
                      <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto mb-4">
                        {`sudo nano /etc/systemd/system/wiki-pdf.service`}
                      </pre>

                      <p className="mb-2">
                        הוסף את התוכן הבא:
                      </p>
                      <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto mb-4">
                        {`[Unit]
Description=Wiki PDF Generator
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target`}
                      </pre>

                      <p className="mb-2">
                        הפעל את השירות:
                      </p>
                      <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto mb-4">
                        {`sudo systemctl enable wiki-pdf
sudo systemctl start wiki-pdf`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
                <h3 className="text-lg font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  גיבוי נתונים
                </h3>
                <p className="text-yellow-800">
                  חשוב לגבות את הנתונים של האפליקציה באופן קבוע. כל הנתונים נשמרים בענן של base44, אך מומלץ לבצע גיבויים תקופתיים של הנתונים.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
