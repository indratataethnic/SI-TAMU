import { Student } from '../types';

export const PRIMARY_SCHOOL_CLASSES = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6'
];

export const PRIMARY_SCHOOL_PARALLEL_CLASSES = [
  'Kelas 1 A',
  'Kelas 1 B',
  'Kelas 1 C',
  'Kelas 2 A',
  'Kelas 2 B',
  'Kelas 2 C',
  'Kelas 3 A',
  'Kelas 3 B',
  'Kelas 3 C',
  'Kelas 4 A',
  'Kelas 4 B',
  'Kelas 4 C',
  'Kelas 5 A',
  'Kelas 5 B',
  'Kelas 5 C',
  'Kelas 6 A',
  'Kelas 6 B',
  'Kelas 6 C'
];

/**
 * Class sorter that puts Kelas 1 -> Kelas 6 in natural numerical & rombel order
 */
export const sortClassNames = (a: string, b: string): number => {
  const getNum = (str: string) => {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
  };
  const numA = getNum(a);
  const numB = getNum(b);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b);
};

/**
 * Gets unique sorted class options matching the actual student database / spreadsheet.
 * If students exist, returns ONLY the distinct classes present in the database.
 * If no student data exists yet, returns the default PRIMARY_SCHOOL_CLASSES.
 */
export const getAvailableClasses = (students: Student[] = []): string[] => {
  const existingClasses = students.map(s => s.class?.trim()).filter(Boolean);
  if (existingClasses.length > 0) {
    const set = new Set<string>(existingClasses);
    return Array.from(set).sort(sortClassNames);
  }
  return [...PRIMARY_SCHOOL_CLASSES];
};

/**
 * Checks if a student belongs to a selected class filter
 * - 'ALL': matches all students
 * - General grade (e.g., 'Kelas 1'): matches 'Kelas 1', 'Kelas 1 A', 'Kelas 1-B', 'Kelas 1A', '1A'
 * - Specific rombel (e.g., 'Kelas 1 A' or 'Kelas 1-A'): matches ONLY 'Kelas 1 A', 'Kelas 1-A', 'Kelas 1A', '1A'
 */
export const matchClassFilter = (studentClass: string = '', filterClass: string = 'ALL'): boolean => {
  if (filterClass === 'ALL' || !filterClass) return true;
  if (!studentClass) return false;

  const sNorm = studentClass.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fNorm = filterClass.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Exact normalized match (e.g. 'kelas1a' === 'kelas1a')
  if (sNorm === fNorm) return true;

  // Helper to parse class string into grade number and optional letter suffix
  const parseClass = (str: string) => {
    const match = str.match(/^(?:kelas)?(\d+)([a-z])?$/);
    if (match) {
      return { grade: match[1], suffix: match[2] || '' };
    }
    return null;
  };

  const parsedF = parseClass(fNorm);
  const parsedS = parseClass(sNorm);

  if (parsedF && parsedS) {
    if (parsedF.grade !== parsedS.grade) return false;
    // If filter has no letter suffix (e.g. 'Kelas 1' -> suffix = ''), match any rombel in grade 1
    if (!parsedF.suffix) return true;
    // If filter has a letter suffix (e.g. 'Kelas 1 A' -> suffix = 'a'), student suffix MUST match 'a'
    return parsedF.suffix === parsedS.suffix;
  }

  // Fallback string inclusion check for custom non-standard class names
  return sNorm.includes(fNorm) || fNorm.includes(sNorm);
};

