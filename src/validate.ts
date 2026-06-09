import { TemplateMetadata } from './templates';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateData(metadata: TemplateMetadata, data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [key, variable] of Object.entries(metadata.variables)) {
    const value = data[key];

    if (variable.required && (value === undefined || value === null)) {
      errors.push(`Missing required variable: "${key}" (${variable.description})`);
      continue;
    }

    if (value === undefined || value === null) continue;

    const typeOk = checkType(value, variable.type);
    if (!typeOk) {
      errors.push(`"${key}" expected ${variable.type}, got ${typeof value}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function checkType(value: unknown, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'string[]':
      return Array.isArray(value) && value.every(v => typeof v === 'string');
    case 'object[]':
      return Array.isArray(value) && value.every(v => typeof v === 'object' && v !== null && !Array.isArray(v));
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return true;
  }
}
