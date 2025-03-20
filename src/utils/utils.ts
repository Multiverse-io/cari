export const mergeObjects = (
  ...objects: Record<string, any>[]
): Record<string, any> => {
  return objects.reduce((result, current) => {
    return { ...result, ...current };
  }, {});
};
