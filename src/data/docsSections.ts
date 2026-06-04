export type SectionConfig = { label: string; slugs: string[] }[];

export const docsSections: Record<string, SectionConfig> = {
  java: [
  ],
  mysql: [
    
  ],
  'ai-assisted-development': [
    {
      label: 'AI & Prompt Engineering',
      slugs: [
        'ai-assistant-how-it-works',
        'prompt-engineering-for-devs',
      ],
    },
    {
      label: 'Agentic Workflow',
      slugs: [
      ],
    },
    {
      label: 'Claude Code',
      slugs: [
      ],
    },
  ],
  'computer-architecture': [
 
  ],


  network: [
    
  ],
  oop: [

  ],
  'operating-system': [

  ],
  redis: [

  ],
  secure: [
    {
      label: 'Authentication',
      slugs: ['jwt', 'oauth'],
    },
  ],
  setting: [
    
  ],
  spring: [
    {
      label: 'Spring Basic',
      slugs: ['introduce', 'oop'],
    },
    {
      label: 'Spring IoC Container & DI',
      slugs: ['Spring Container', 'Beans', 'Component Scan', 'Dependency Injection'],
    },
    {
      label: 'Spring Web',
      slugs: ['servlet', 'spring-web-mvc', 'dispatcher-servlet', 'handler-mapping-adapter', 'view-resolver', 'message-converter', 'validation', 'filter-interceptor', 'exception-handling'],
    },
    {
      label: 'JPA Basic',
      slugs: ['jpa-introduce', 'jpa-persistence-context', 'jpa-entity-mapping', 'jpa-relation-mapping-basic', 'jpa-relation-mapping-advanced', 'jpa-proxy', 'jpa-value-type', 'jpa-query-syntex-basic', 'jpa-query-syntex-advanced'],
    },
    {
      label: 'JPA Performance Optimization',
      slugs: ['jpa-api-basic', 'jpa-api-advanced-1', 'jpa-api-advanced-2', 'jpa-osiv'],
    },
    {
      label: 'Spring Data JPA',
      slugs: ['jpa-common-interface', 'jpa-query-method', 'jpa-paging-sort', 'jpa-bulk', 'jpa-entitygraph', 'jpa-extend', 'jpa-sp', 'jpa-others'],
    },
  ],
  test: [
    
  ],
  
};