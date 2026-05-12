export const uniqueList = (items = []) => [...new Set(items.map((item) => item?.toString().trim()).filter(Boolean))];

export const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const normalizeComparableText = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

export const parseList = (value = '') => {
  if (Array.isArray(value)) {
    return value.map((item) => item?.toString().trim()).filter(Boolean);
  }

  return value
    .toString()
    .split('\n')
    .flatMap((line) => line.split(','))
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parseLooseList = (value = '') => {
  if (Array.isArray(value)) {
    return value.map((item) => item?.toString().trim()).filter(Boolean);
  }

  return value
    .toString()
    .split(/\r?\n|[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parseLineItems = (value = '') =>
  value
    .toString()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const splitPipedLine = (line, count = 2) => {
  const parts = line.toString().split('|').map((part) => part.trim());
  while (parts.length < count) parts.push('');
  return parts.slice(0, count);
};

export const parseStructuredLines = (value, count, mapper) =>
  parseLineItems(value)
    .map((line) => splitPipedLine(line, count))
    .map((parts, index) => mapper(parts, index))
    .filter(Boolean);

export const formatList = (items = [], separator = ', ') => items.join(separator);

export const formatStructuredLines = (items = [], formatter) => items.map(formatter).join('\n');
