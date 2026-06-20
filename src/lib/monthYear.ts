export function getCurrentMonthYear(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function parseMonthYearParams(yearRaw: string | null, monthRaw: string | null): { year: number; month: number } | null {
  if (yearRaw === null || yearRaw === '' || monthRaw === null || monthRaw === '') {
    return null;
  }

  const parsedYear = Number(yearRaw);
  const parsedMonth = Number(monthRaw);

  if (!Number.isFinite(parsedYear) || parsedYear < 1970 || parsedYear > 9999) {
    return null;
  }

  if (!Number.isFinite(parsedMonth) || parsedMonth < 0 || parsedMonth > 11) {
    return null;
  }

  return { year: parsedYear, month: parsedMonth };
}

export function parseMonthYear(searchParams: URLSearchParams): { year: number; month: number } {
  return (
    parseMonthYearParams(searchParams.get('year'), searchParams.get('month')) ??
    getCurrentMonthYear()
  );
}

export function hasMonthYearParams(searchParams: URLSearchParams): boolean {
  return parseMonthYearParams(searchParams.get('year'), searchParams.get('month')) !== null;
}

export function monthYearSearchParams(year: number, month: number): Record<string, string> {
  return { year: String(year), month: String(month) };
}

export function monthYearPath(path: string, year: number, month: number): string {
  return `${path}?year=${year}&month=${month}`;
}
