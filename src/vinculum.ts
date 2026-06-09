import { TemplateInfo } from './templates';

export interface VinculumReport {
  template: string;
  centralVinculum: string;
  preserves: string[];
  sacrifices: string[];
  variables: Array<{ name: string; status: string; description: string }>;
}

export function analyze(template: TemplateInfo, data?: Record<string, unknown>): VinculumReport {
  const variableReports = Object.entries(template.metadata.variables).map(([name, v]) => {
    let status: string;
    if (data && data[name] !== undefined) {
      status = 'provided';
    } else if (v.required) {
      status = 'required (missing)';
    } else {
      status = 'optional';
    }
    return { name, status, description: v.description };
  });

  return {
    template: template.name,
    centralVinculum: `\n    template + context\n    ────────────────\n    rendered document\n`,
    preserves: [...template.metadata.vinculum.preserves],
    sacrifices: [...template.metadata.vinculum.sacrifices],
    variables: variableReports
  };
}

export function formatReport(report: VinculumReport): string {
  const lines: string[] = [];
  lines.push(`# Vinculum Analysis: ${report.template}`);
  lines.push('');
  lines.push('## Central Vinculum');
  lines.push('```');
  lines.push(report.centralVinculum.trim());
  lines.push('```');
  lines.push('');
  lines.push('## Variables');
  lines.push('');
  lines.push('| Variable | Status | Description |');
  lines.push('|----------|--------|-------------|');
  for (const v of report.variables) {
    lines.push(`| ${v.name} | ${v.status} | ${v.description} |`);
  }
  lines.push('');
  lines.push('## Preserves');
  for (const p of report.preserves) {
    lines.push(`- ✅ ${p}`);
  }
  lines.push('');
  lines.push('## Sacrifices');
  for (const s of report.sacrifices) {
    lines.push(`- ❌ ${s}`);
  }
  lines.push('');
  return lines.join('\n');
}
