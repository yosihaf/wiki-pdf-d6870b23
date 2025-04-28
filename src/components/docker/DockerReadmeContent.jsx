import React from 'react';

export default function DockerReadmeContent() {
  const content = `# הרצת WikiPDF ב-Docker

מסמך זה מסביר כיצד להריץ את אפליקציית WikiPDF באמצעות Docker.

## דרישות

- Docker
- Docker Compose

## הרצה בסביבת ייצור

1. בנה והרץ את הקונטיינר:

\`\`\`bash
cd components/docker
docker-compose up -d
\`\`\`

2. האפליקציה תרוץ בכתובת: http://localhost:3000

## הרצה בסביבת פיתוח

1. בנה והרץ את קונטיינר הפיתוח:

\`\`\`bash
cd components/docker
docker-compose -f docker-compose.dev.yml up -d
\`\`\`

2. האפליקציה תרוץ בכתובת: http://localhost:3000 עם hot-reload

## התאמת הגדרות

ניתן להתאים את הגדרות האפליקציה באמצעות משתני סביבה:

\`\`\`bash
# הרצה עם הגדרות מותאמות
docker-compose up -d -e PORT=8080 -e WIKI_PDF_API_URL=https://pdf.example.com
\`\`\`

## עצירת הקונטיינר

\`\`\`bash
# עצירת קונטיינר הייצור
docker-compose down

# עצירת קונטיינר הפיתוח
docker-compose -f docker-compose.dev.yml down
\`\`\`

## נפחים וגיבויים

נתוני האפליקציה נשמרים בנפח Docker בשם \`wikipdf_data\`. לגיבוי הנתונים:

\`\`\`bash
# יצירת גיבוי
docker run --rm -v wikipdf_data:/data -v $(pwd):/backup alpine tar cvf /backup/wikipdf_backup.tar /data

# שחזור מגיבוי
docker run --rm -v wikipdf_data:/data -v $(pwd):/backup alpine tar xvf /backup/wikipdf_backup.tar
\`\`\`

## פתרון תקלות

1. בדיקת הלוגים:
\`\`\`bash
docker-compose logs -f
\`\`\`

2. כניסה לקונטיינר:
\`\`\`bash
docker exec -it wikipdf-app sh
\`\`\`

3. הפעלה מחדש של הקונטיינר:
\`\`\`bash
docker-compose restart
\`\`\``;

  return (
    <div className="markdown">
      <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
        {content}
      </pre>
    </div>
  );
}