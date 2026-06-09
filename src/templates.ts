import fs from 'fs-extra';
import path from 'path';

export interface TemplateVariable {
  type: string;
  required: boolean;
  description: string;
}

export interface VinculumTradeoff {
  preserves: string[];
  sacrifices: string[];
}

export interface TemplateMetadata {
  description: string;
  variables: Record<string, TemplateVariable>;
  vinculum: VinculumTradeoff;
}

export interface TemplateInfo {
  name: string;
  filePath: string;
  metadata: TemplateMetadata;
  content: string;
}

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const REGISTRY_PATH = path.join(TEMPLATES_DIR, 'template-metadata.json');

let metadataCache: Record<string, TemplateMetadata> | undefined;

function loadMetadata(): Record<string, TemplateMetadata> {
  if (metadataCache !== undefined) return metadataCache;
  try {
    metadataCache = fs.readJsonSync(REGISTRY_PATH) as Record<string, TemplateMetadata>;
  } catch {
    metadataCache = {};
    return {};
  }
  return metadataCache;
}

export function list(): string[] {
  const files = fs.readdirSync(TEMPLATES_DIR);
  return files.filter(f => f.endsWith('.hbs')).sort();
}

export function get(name: string): TemplateInfo | null {
  const templatePath = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(templatePath)) return null;

  const meta = loadMetadata();
  const content = fs.readFileSync(templatePath, 'utf-8');

  return {
    name,
    filePath: templatePath,
    metadata: meta[name] || {
      description: `${name} template`,
      variables: {},
      vinculum: { preserves: [], sacrifices: [] }
    },
    content
  };
}
