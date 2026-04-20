export const localizeEntity = (entity = {}, locale = 'vi') => {
  if (locale === 'vi') return entity;
  const localized = entity?.translations?.[locale];
  if (!localized || typeof localized !== 'object') return entity;
  const nonEmptyLocalized = Object.entries(localized).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    return {
      ...acc,
      [key]: value,
    };
  }, {});
  return {
    ...entity,
    ...nonEmptyLocalized,
  };
};
