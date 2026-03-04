const MAX_PASSWORD_SECTOR = 12;

const SECTOR_PASSWORD_CODES = {
  2: 'CINDER',
  3: 'HOLLOW',
  4: 'MANTIS',
  5: 'MIRE',
  6: 'VESSEL',
  7: 'SPORE',
  8: 'STATIC',
  9: 'SHARD',
  10: 'UMBRA',
  11: 'CRYPT',
  12: 'RELIC'
};

export function resolveSectorPassword(inputValue) {
  const normalizedInput = String(inputValue ?? '').trim().toUpperCase();
  if (!normalizedInput) {
    return null;
  }

  const matchedCode = Object.entries(SECTOR_PASSWORD_CODES).find(([, code]) => code === normalizedInput);
  if (matchedCode) {
    return Number(matchedCode[0]);
  }

  if (normalizedInput.includes('-')) {
    return null;
  }

  const compactInput = normalizedInput.replace(/[\s_]+/g, '');
  let sectorNumber = null;

  if (/^\d+$/.test(compactInput)) {
    sectorNumber = Number(compactInput);
  } else if (/^S\d+$/.test(compactInput)) {
    sectorNumber = Number(compactInput.slice(1));
  } else if (/^SECTOR\d+$/.test(compactInput)) {
    sectorNumber = Number(compactInput.slice(6));
  } else if (/^AIRLOCK\d+$/.test(compactInput)) {
    sectorNumber = Number(compactInput.slice(7));
  }

  if (!Number.isFinite(sectorNumber)) {
    return null;
  }

  const roundedSector = Math.round(sectorNumber);
  if (roundedSector < 1 || roundedSector > MAX_PASSWORD_SECTOR) {
    return null;
  }

  return roundedSector;
}
