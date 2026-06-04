export interface DocsGroupItem {
  key: string;
  label: string;
}

export interface DocsGroup {
  label: string;
  items: DocsGroupItem[];
}

export const DOCS_GROUPS: DocsGroup[] = [
  { label: 'Computer Science', items: [
    { key: 'computer-architecture', label: 'Computer Architecture' },
    { key: 'operating-system', label: 'Operating System' },
    { key: 'network', label: 'Network' },
  ]},
  { label: 'Database', items: [
    { key: 'mysql', label: 'MySQL' },
    { key: 'oracle', label: 'Oracle' },
    { key: 'redis', label: 'Redis' },
  ]},
  { label: 'Language', items: [
    { key: 'java', label: 'Java' },
  ]},
  { label: 'Framework', items: [
    { key: 'spring', label: 'Spring' },
  ]},
  { label: 'Software Engineering', items: [
    { key: 'test', label: 'Test' },
    { key: 'ai-assisted-development', label: 'AI-Assisted Development' },
  ]},
  { label: 'System Architecture', items: [
    { key: 'large-scale-system', label: 'Large-Scale System' },
  ]},
  { label: 'ETC', items: [
    { key: 'setting', label: 'Setting' },
  ]},
];