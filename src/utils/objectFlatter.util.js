export const flattenObject = (obj, parentKey = '', result = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}#${key}` : key;

    if (Array.isArray(value)) {
      if (
        key === 'coordinates' &&
        parentKey.endsWith('geometry')
      ) {
        result[newKey] = value[0];
      } else {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            flattenObject(item, `${newKey}[${index}]`, result);
          } else {
            result[`${newKey}[${index}]`] = item;
          }
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }
  return result;
};


export function unflattenObject(flattenedData) {
  const result = [];

  flattenedData.forEach((entry, index) => {
    result[index] = {};
    entry.forEach(({ key, value }) => {
      if (typeof key !== 'string' || key.trim() === '') {
        throw new Error('Key must be a string');
      }

      const parts = key.split('#');
      let current = result[index];

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);

        if (arrayMatch) {
          const prop = arrayMatch[1];
          const idx = Number(arrayMatch[2]);

          current[prop] = current[prop] || [];
          current[prop][idx] = current[prop][idx] || {};

          if (i === parts.length - 1) {
            current[prop][idx] = value;
          } else {
            current = current[prop][idx];
          }

        } else {
          if (i === parts.length - 1) {
            current[part] = value;
          } else {
            current[part] = current[part] || {};
            current = current[part];
          }
        }
      }
    });
  });

  return result;
}
