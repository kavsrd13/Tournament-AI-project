const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const trackedFiles = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);
const branches = execFileSync('git', ['branch', '--format=%(refname:short)'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);
const trackedBytes = trackedFiles.reduce((total, file) => {
  try {
    return total + fs.statSync(path.join(root, file)).size;
  } catch {
    return total;
  }
}, 0);

const trackedDependencies = trackedFiles.filter((file) => /(^|[\\/])node_modules([\\/]|$)/.test(file));
const trackedSecrets = trackedFiles.filter((file) => /(^|[\\/])\.env($|\.)/.test(file) && !file.endsWith('.env.example'));
const sizeMb = trackedBytes / (1024 * 1024);
const failures = [];

if (sizeMb >= 10) failures.push(`tracked repository content is ${sizeMb.toFixed(2)} MB (limit: <10 MB)`);
if (branches.length !== 1) failures.push(`repository has ${branches.length} branches (limit: 1)`);
if (trackedDependencies.length) failures.push(`${trackedDependencies.length} node_modules files are tracked`);
if (trackedSecrets.length) failures.push(`possible secret files are tracked: ${trackedSecrets.join(', ')}`);

console.log(`Tracked content: ${sizeMb.toFixed(2)} MB`);
console.log(`Branches: ${branches.join(', ') || '(none)'}`);
console.log(`Tracked node_modules files: ${trackedDependencies.length}`);

if (failures.length) {
  console.error('\nSubmission checks failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('\nSubmission checks passed.');
}
