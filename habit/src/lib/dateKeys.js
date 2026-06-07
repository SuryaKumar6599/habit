const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

export const toLocalDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayKey = () => toLocalDateKey();

export const parseDateKey = (dateKey) => {
  const match = String(dateKey || '').match(DATE_KEY_PATTERN);
  if (!match) return new Date(NaN);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const addDays = (value, days) => {
  const date = typeof value === 'string' ? parseDateKey(value) : new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

export const dateKeyDaysAgo = (daysAgo, from = new Date()) => (
  toLocalDateKey(addDays(from, -daysAgo))
);

export const previousDateKey = (dateKey) => toLocalDateKey(addDays(dateKey, -1));
