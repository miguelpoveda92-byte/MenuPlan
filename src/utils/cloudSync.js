export const DEFAULT_SYNC_ROOM_ID = 'menuplan_miguel_rosa_8f4c2a91e7b3';
export const SHARED_JSON_DRIVE_FILE_ID = '1Nfq-dT1UxxT1iKcpCMjdHIrcLUQCQeNU';
export const SYNC_STORAGE_KEYS = {
  ROOM_ID: 'menuplan_sync_room_v1',
  GAS_SYNC_URL: 'menuplan_sync_gas_url_v1',
  LAST_UPDATED_AT: 'menuplan_last_updated_at_v1',
};

export const GOOGLE_APPS_SCRIPT_SYNC_TEMPLATE = `var FILE_ID = '${SHARED_JSON_DRIVE_FILE_ID}';

function doGet() {
  var file = DriveApp.getFileById(FILE_ID);
  var text = file.getBlob().getDataAsString('UTF-8');
  return ContentService.createTextOutput(text || '{}')
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var file = DriveApp.getFileById(FILE_ID);
  file.setContent(e.postData.contents);
  return ContentService.createTextOutput(e.postData.contents)
    .setMimeType(ContentService.MimeType.JSON);
}`;

function getRoomEndpoint(roomId) {
  const cleanRoom = (roomId || DEFAULT_SYNC_ROOM_ID).trim() || DEFAULT_SYNC_ROOM_ID;
  return `https://textdb.dev/api/data/${encodeURIComponent(cleanRoom)}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    return await fetch(url, {
      ...options,
      signal: controller ? controller.signal : undefined,
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function fetchSharedState(roomId = DEFAULT_SYNC_ROOM_ID, customSyncUrl = '') {
  const cleanCustomUrl = (customSyncUrl || '').trim();
  const targetUrl = cleanCustomUrl || getRoomEndpoint(roomId);

  const res = await fetchWithTimeout(
    targetUrl,
    {
      method: 'GET',
      cache: 'no-store',
    },
    10000,
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Error al leer estado compartido (${res.status})`);
  }

  const rawText = await res.text();
  if (!rawText || !rawText.trim()) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.weeklyMenu || !Array.isArray(parsed.recipes)) {
    return null;
  }

  return parsed;
}

export async function pushSharedState(
  roomId = DEFAULT_SYNC_ROOM_ID,
  statePayload,
  customSyncUrl = '',
) {
  const cleanCustomUrl = (customSyncUrl || '').trim();
  const targetUrl = cleanCustomUrl || getRoomEndpoint(roomId);

  const payloadToSave = {
    version: 1,
    updatedAt: Number(statePayload.updatedAt) || Date.now(),
    updatedBy: statePayload.updatedBy || 'MenuPlan',
    recipes: statePayload.recipes,
    weeklyMenu: statePayload.weeklyMenu,
    shoppingState: statePayload.shoppingState,
  };

  const res = await fetchWithTimeout(
    targetUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': cleanCustomUrl ? 'text/plain;charset=utf-8' : 'application/json',
      },
      body: JSON.stringify(payloadToSave),
    },
    12000,
  );

  if (!res.ok) {
    throw new Error(`Error al guardar estado compartido (${res.status})`);
  }

  return {
    ok: true,
    updatedAt: payloadToSave.updatedAt,
  };
}
