export const flattenObject = (obj, parentKey = '', result = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;

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
