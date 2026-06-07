import { createSign } from 'crypto';

export type DeliveryTarget = 'drive' | 'chat' | 'antigravity';

export type DeliveryResult = {
  notice: 'delivered' | 'drive_not_configured' | 'chat';
  deliveryRef: string | null;
  content?: string;
};

type GoogleCredentials = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function googleAccessToken(credentials: GoogleCredentials) {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri =
    credentials.token_uri ?? 'https://oauth2.googleapis.com/token';
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: tokenUri,
      iat: now,
      exp: now + 3600
    })
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(
    signer.sign(credentials.private_key)
  )}`;
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    }),
    cache: 'no-store'
  });
  const payload = (await response.json()) as {
    access_token?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ?? `Google OAuth failed with ${response.status}`
    );
  }

  return payload.access_token;
}

async function deliverToDrive(
  orgId: string,
  assembledPrompt: string,
  credentialsJson: string,
  folderId: string
) {
  let credentials: GoogleCredentials;

  try {
    credentials = JSON.parse(credentialsJson) as GoogleCredentials;
  } catch {
    throw new Error('GOOGLE_DRIVE_CREDENTIALS_JSON is not valid JSON');
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Google Drive credentials are missing required fields');
  }

  const accessToken = await googleAccessToken(credentials);
  const boundary = `acaios_${Date.now().toString(16)}`;
  const metadata = {
    name: `AcaiOS Antigravity Prompt - ${orgId}`,
    mimeType: 'application/vnd.google-apps.document',
    parents: [folderId]
  };
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    assembledPrompt,
    `--${boundary}--`,
    ''
  ].join('\r\n');
  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': `multipart/related; boundary=${boundary}`
      },
      body,
      cache: 'no-store'
    }
  );
  const payload = (await response.json()) as {
    id?: string;
    webViewLink?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.id) {
    throw new Error(
      payload.error?.message ?? `Google Drive upload failed with ${response.status}`
    );
  }

  return payload.webViewLink ?? `https://docs.google.com/document/d/${payload.id}/edit`;
}

export async function deliverPrompt(
  orgId: string,
  assembledPrompt: string,
  target: DeliveryTarget
): Promise<DeliveryResult> {
  if (target === 'chat') {
    return {
      notice: 'chat',
      deliveryRef: null,
      content: assembledPrompt
    };
  }

  if (target === 'antigravity') {
    throw new Error('antigravity_trigger_not_available');
  }

  const credentialsJson = process.env.GOOGLE_DRIVE_CREDENTIALS_JSON;
  const folderId = process.env.ACAIOS_PROMPT_DRIVE_FOLDER_ID;

  if (!credentialsJson || !folderId) {
    return {
      notice: 'drive_not_configured',
      deliveryRef: null
    };
  }

  const deliveryRef = await deliverToDrive(
    orgId,
    assembledPrompt,
    credentialsJson,
    folderId
  );

  return { notice: 'delivered', deliveryRef };
}
