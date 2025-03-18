type Grouped<T> = { [key: string]: T[] };

export function groupBy<T>(array: T[], key: keyof T): Grouped<T> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {} as Grouped<T>);
}

export const mergeObjects = (
  ...objects: Record<string, any>[]
): Record<string, any> => {
  return objects.reduce((result, current) => {
    return { ...result, ...current };
  }, {});
};
