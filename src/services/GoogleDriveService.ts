const DRIVE_API_BASE = 'https://www.googleapis.com/upload/drive/v3';
const DRIVE_API_FILES = 'https://www.googleapis.com/drive/v3/files';
const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
const SERVICE_ACCOUNT_EMAIL = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

class GoogleDriveService {
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    /**
     * Gets an access token (reuses the same JWT flow as Sheets)
     */
    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
            return this.accessToken;
        }

        const header = { alg: 'RS256', typ: 'JWT' };
        const now = Math.floor(Date.now() / 1000);
        const claim = {
            iss: SERVICE_ACCOUNT_EMAIL,
            scope: 'https://www.googleapis.com/auth/drive.file',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now,
        };

        const base64UrlEncode = (obj: object): string => {
            const str = JSON.stringify(obj);
            const base64 = btoa(unescape(encodeURIComponent(str)));
            return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        };

        const headerB64 = base64UrlEncode(header);
        const claimB64 = base64UrlEncode(claim);
        const signatureInput = `${headerB64}.${claimB64}`;

        const privateKey = await this.importPrivateKey(PRIVATE_KEY);
        const signature = await this.signData(signatureInput, privateKey);
        const jwt = `${signatureInput}.${signature}`;

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get access token: ${await response.text()}`);
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + data.expires_in * 1000;
        return this.accessToken!;
    }

    private async importPrivateKey(pem: string): Promise<CryptoKey> {
        if (!pem) throw new Error('Private key is missing');

        const pemContents = pem
            .replace(/-----BEGIN PRIVATE KEY-----/g, '')
            .replace(/-----END PRIVATE KEY-----/g, '')
            .replace(/[^A-Za-z0-9+/=]/g, ''); // Keep ONLY valid Base64 characters

        try {
            const binaryStr = atob(pemContents);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }

            return await crypto.subtle.importKey(
                'pkcs8',
                bytes.buffer,
                { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
                false,
                ['sign']
            );
        } catch (e) {
            console.error('Error decoding private key:', e);
            throw new Error('Error al decodificar la clave privada.');
        }
    }

    private async signData(data: string, key: CryptoKey): Promise<string> {
        const encoder = new TextEncoder();
        const signature = await crypto.subtle.sign(
            'RSASSA-PKCS1-v1_5',
            key,
            encoder.encode(data)
        );

        const bytes = new Uint8Array(signature);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    /**
     * Uploads an image file to Google Drive
     */
    async uploadImage(file: File, fileName?: string): Promise<string> {
        const token = await this.getAccessToken();
        const finalName = fileName || `asset_${Date.now()}_${file.name}`;

        // Create multipart request
        const metadata = {
            name: finalName,
            parents: [FOLDER_ID],
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve) => {
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]); // Get base64 part
            };
            reader.readAsDataURL(file);
        });

        const multipartBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            `Content-Type: ${file.type}\r\n` +
            'Content-Transfer-Encoding: base64\r\n\r\n' +
            fileData +
            closeDelimiter;

        const response = await fetch(
            `${DRIVE_API_BASE}/files?uploadType=multipart&fields=id,webViewLink,webContentLink`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`,
                },
                body: multipartBody,
            }
        );

        if (!response.ok) {
            throw new Error(`Upload failed: ${await response.text()}`);
        }

        const data = await response.json();

        // Make the file publicly accessible
        await this.makePublic(data.id);

        // Return a direct image URL using lh3.googleusercontent.com format
        // This format works better in browsers than the uc?export=view format
        return `https://lh3.googleusercontent.com/d/${data.id}`;
    }

    /**
     * Makes a file publicly accessible
     */
    private async makePublic(fileId: string): Promise<void> {
        const token = await this.getAccessToken();

        await fetch(`${DRIVE_API_FILES}/${fileId}/permissions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                role: 'reader',
                type: 'anyone',
            }),
        });
    }

    /**
     * Deletes a file from Google Drive
     */
    async deleteImage(fileUrl: string): Promise<void> {
        // Extract file ID from various URL formats
        let fileId: string | null = null;
        
        // Format: https://drive.google.com/uc?export=view&id=FILE_ID
        const ucMatch = fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (ucMatch) fileId = ucMatch[1];
        
        // Format: https://lh3.googleusercontent.com/d/FILE_ID
        const lh3Match = fileUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
        if (lh3Match) fileId = lh3Match[1];
        
        // Format: https://drive.google.com/file/d/FILE_ID/view
        const fileMatch = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileMatch) fileId = fileMatch[1];

        if (!fileId) return;

        const token = await this.getAccessToken();

        await fetch(`${DRIVE_API_FILES}/${fileId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    /**
     * Gets a thumbnail URL for a Drive image
     */
    getThumbnailUrl(fileUrl: string, size: number = 200): string {
        let fileId: string | null = null;
        
        // Format: https://drive.google.com/uc?export=view&id=FILE_ID
        const ucMatch = fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (ucMatch) fileId = ucMatch[1];
        
        // Format: https://lh3.googleusercontent.com/d/FILE_ID
        const lh3Match = fileUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
        if (lh3Match) fileId = lh3Match[1];
        
        // Format: https://drive.google.com/file/d/FILE_ID/view
        const fileMatch = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileMatch) fileId = fileMatch[1];

        if (!fileId) return fileUrl;

        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
    }

    /**
     * Converts any Google Drive URL to a direct viewable URL
     */
    getDirectUrl(fileUrl: string): string {
        let fileId: string | null = null;
        
        // Format: https://drive.google.com/uc?export=view&id=FILE_ID
        const ucMatch = fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (ucMatch) fileId = ucMatch[1];
        
        // Format: https://lh3.googleusercontent.com/d/FILE_ID
        const lh3Match = fileUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
        if (lh3Match) fileId = lh3Match[1];
        
        // Format: https://drive.google.com/file/d/FILE_ID/view
        const fileMatch = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileMatch) fileId = fileMatch[1];

        if (!fileId) return fileUrl;

        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
}

export const googleDriveService = new GoogleDriveService();
