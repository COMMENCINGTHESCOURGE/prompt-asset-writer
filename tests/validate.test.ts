import { describe, it, expect } from 'vitest';
import { validateData } from '../src/validate';

describe('validate', () => {
  const meta = {
    description: 'test',
    variables: {
      title: { type: 'string', required: true, description: 'Title' },
      count: { type: 'number', required: false, description: 'Count' },
      tags: { type: 'string[]', required: true, description: 'Tags' },
      items: { type: 'object[]', required: false, description: 'Items' }
    },
    vinculum: { preserves: [], sacrifices: [] }
  };

  it('passes valid data', () => {
    const result = validateData(meta, { title: 'Test', tags: ['a', 'b'] });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails on missing required field', () => {
    const result = validateData(meta, { title: 'Test' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('tags'))).toBe(true);
  });

  it('fails on type mismatch', () => {
    const result = validateData(meta, { title: 'Test', tags: 'not-array' });
    expect(result.valid).toBe(false);
  });

  it('passes with optional fields missing', () => {
    const result = validateData(meta, { title: 'Test', tags: ['x'] });
    expect(result.valid).toBe(true);
  });
});
