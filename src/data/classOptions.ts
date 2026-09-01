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
  'Kelas 1',
  'Kelas 1-A',
  'Kelas 1-B',
  'Kelas 2',
  'Kelas 2-A',
  'Kelas 2-B',
  'Kelas 3',
  'Kelas 3-A',
  'Kelas 3-B',
  'Kelas 4',
  'Kelas 4-A',
  'Kelas 4-B',
  'Kelas 5',
  'Kelas 5-A',
  'Kelas 5-B',
  'Kelas 6',
  'Kelas 6-A',
  'Kelas 6-B'
];

/**
 * Class sorter that puts Kelas 1 -> Kelas 6 in natural numerical order
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
 * Gets unique sorted class options combining preset classes (Kelas 1 - Kelas 6) and existing student data
 */
export const getAvailableClasses = (students: Student[] = []): string[] => {
  const existingClasses = students.map(s => s.class).filter(Boolean);
  const set = new Set<string>([...PRIMARY_SCHOOL_CLASSES, ...existingClasses]);
  return Array.from(set).sort(sortClassNames);
};

/**
 * Checks if a student belongs to a selected class filter
 * Supports exact match or prefix match (e.g. filter 'Kelas 1' matches 'Kelas 1', 'Kelas 1-A', 'Kelas 1B', '1', '1A')
 */
export const matchClassFilter = (studentClass: string = '', filterClass: string = 'ALL'): boolean => {
  if (filterClass === 'ALL' || !filterClass) return true;
  if (studentClass === filterClass) return true;

  // Normalized check
  const normStudent = studentClass.toLowerCase().replace(/\s+/g, '');
  const normFilter = filterClass.toLowerCase().replace(/\s+/g, '');
  if (normStudent === normFilter) return true;

  // If filter is "kelas 1", match "kelas 1-a", "kelas 1b", "1a", etc.
  const filterDigits = normFilter.match(/\d+/)?.[0];
  const studentDigits = normStudent.match(/\d+/)?.[0];
  if (filterDigits && studentDigits && filterDigits === studentDigits) {
    if (normFilter === `kelas${filterDigits}` || normFilter === filterDigits) {
      return true;
    }
  }

  return false;
};
