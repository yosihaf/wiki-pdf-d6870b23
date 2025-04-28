export default function NginxConfig() {
  const content = `# הגדרת Nginx לאירוח ההאפליקציה

להלן דוגמה להגדרות Nginx לאירוח האפליקציה בשרת הפקה:

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # הפניה ל-HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    # הגדרות SSL
    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;
    
    # הגדרות אבטחה מתקדמות
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # הגדרות HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # הגדרות אבטחה נוספות
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # הגבלת קצב בקשות
    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;
    limit_req zone=one burst=10 nodelay;
    
    # העברת בקשות לאפליקציה
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # הגדרת קבצים סטטיים (אופציונלי)
    location /static {
        alias /path/to/your/static/files;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
    
    # הגבלת גישה לקבצים רגישים
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
\`\`\`

שים לב להחליף את הערכים הבאים:

1. \`your-domain.com\` - עם שם הדומיין שלך
2. \`/path/to/your/fullchain.pem\` - עם הנתיב לקובץ האישור SSL
3. \`/path/to/your/privkey.pem\` - עם הנתיב למפתח הפרטי של SSL
4. \`/path/to/your/static/files\` - אם יש לך קבצים סטטיים

## הוראות התקנה

1. העתק את ההגדרות לקובץ:

\`\`\`bash
sudo nano /etc/nginx/sites-available/wikipdf
\`\`\`

2. צור קישור סימבולי:

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/wikipdf /etc/nginx/sites-enabled/
\`\`\`

3. בדוק את תקינות ההגדרות:

\`\`\`bash
sudo nginx -t
\`\`\`

4. הפעל מחדש את Nginx:

\`\`\`bash
sudo systemctl restart nginx
\`\`\``;

  return (
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
      {content}
    </pre>
  );
}