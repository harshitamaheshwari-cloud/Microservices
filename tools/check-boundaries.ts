import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Violation {
  file: string;
  importPath: string;
  reason: string;
}

export function findViolations(root: string): Violation[] {
  const modulesDir = path.join(root, 'src/modules');
  const platformDir = path.join(root, 'src/platform');
  const violations: Violation[] = [];

  function walk(dir: string): void {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(file);
      } else if (entry.name.endsWith('.ts')) {
        checkFile(file);
      }
    }
  }

  function checkFile(file: string): void {
    const code = fs.readFileSync(file, 'utf8');

    const imports = [
      ...code.matchAll(
        /\b(?:import|export)\s+(?:type\s+)?(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g
      ),
    ];

    const currentModule = path.relative(modulesDir, file).split(path.sep)[0];

    for (const match of imports) {
      const importPath = match[1];

      // Reject package imports.
      if (!importPath.startsWith('.')) {
        violations.push({
          file: path.relative(root, file),
          importPath,
          reason: 'Non-relative import',
        });
        continue;
      }

      const target = path.resolve(path.dirname(file), importPath);

      // Allow imports from src/platform.
      if (target.startsWith(platformDir + path.sep)) continue;

      // Allow imports inside the current module.
      const currentDir = path.join(modulesDir, currentModule);

      if (target.startsWith(currentDir + path.sep)) continue;

      // Allow another module's index.ts only.
      if (
        target.startsWith(modulesDir + path.sep) &&
        path.basename(target) === 'index.ts'
      ) {
        continue;
      }

      violations.push({
        file: path.relative(root, file),
        importPath,
        reason: 'Import crosses module boundaries',
      });
    }
  }

  walk(modulesDir);
  return violations;
}

const script = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === script) {
  const violations = findViolations(process.cwd());

  if (violations.length > 0) {
    console.error(violations);
    process.exitCode = 1;
  } else {
    console.log('No boundary violations found.');
    process.exitCode = 0;
  }
}
