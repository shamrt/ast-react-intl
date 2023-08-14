
import { remove } from 'diacritics';
import slugify from 'slugify';

export const getStableKey = (str: string, keyMaxLength: number = 40) => {
  const cleanStr = remove(str)
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/ +/g, '_')
    .replace(/\s+/g, '')
    .replace(/[.*+?^${}()|[\]\\/-:,!"]/g, '')
    .replace(/'+/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F]/g, "")
    .slice(0, keyMaxLength);

  return slugify(cleanStr);
};

export const getStableValue = (str: string) => str
    .trim()
    .replace(/\s+/g, ' ');
