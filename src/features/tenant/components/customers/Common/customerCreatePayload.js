/** Flatten DRF validation payloads into field -> message for form errors. */
export function flattenValidationErrors(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.details && typeof data.details === 'object') return data.details;

  const flat = {};
  const walk = (obj, prefix = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      if (key === 'detail' || key === 'message') return;
      const fieldKey = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(value)) {
        flat[fieldKey] = value.join(' ');
      } else if (value && typeof value === 'object') {
        walk(value, fieldKey);
      } else if (value != null) {
        flat[fieldKey] = String(value);
      }
    });
  };
  walk(data);
  return Object.keys(flat).length ? flat : null;
}

/** Build a clean create payload for consignor/consignee/customer profile APIs. */
export function sanitizeProfileCreatePayload(form, { createPortalUser, isCreate }) {
  const payload = { ...form };

  ['id', 'customer', 'customer_code', 'created_at', 'updated_at'].forEach((key) => {
    delete payload[key];
  });

  if (isCreate) {
    delete payload.customer_id;
    if (createPortalUser) {
      delete payload.user_id;
      if (payload.user) {
        Object.keys(payload.user).forEach((k) => {
          if (typeof payload.user[k] === 'string') payload.user[k] = payload.user[k].trim();
        });
      }
    } else {
      delete payload.user;
    }
  } else {
    delete payload.user;
  }

  return payload;
}
