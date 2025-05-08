import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

console.log('📦 Extreme Router Bundle Size Report 📦');
console.log('======================================');

const distDir = path.join(process.cwd(), 'dist');
const files = fs
  .readdirSync(distDir)
  .filter((file) => file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs'));

// Store results for file output
const report = {
  files: {},
  total: { minified: 0, gzipped: 0 },
};

// Show individual file sizes
for (const file of files) {
  const filePath = path.join(distDir, file);
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);

  const minifiedKB = (content.length / 1024).toFixed(2);
  const gzippedKB = (gzipped.length / 1024).toFixed(2);

  report.files[file] = {
    minified: `${minifiedKB} KB`,
    gzipped: `${gzippedKB} KB`,
    minifiedBytes: content.length,
    gzippedBytes: gzipped.length,
  };

  console.log(`\n${file}`);
  console.log(`  Minified: ${minifiedKB} KB`);
  console.log(`  Gzipped:  ${gzippedKB} KB`);

  report.total.minified += content.length;
  report.total.gzipped += gzipped.length;
}

// Calculate total bundle size
report.total.minifiedKB = `${(report.total.minified / 1024).toFixed(2)} KB`;
report.total.gzippedKB = `${(report.total.gzipped / 1024).toFixed(2)} KB`;

console.log('\n📊 Total Bundle Size:');
console.log(`  Minified: ${report.total.minifiedKB}`);
console.log(`  Gzipped:  ${report.total.gzippedKB}`);

// Save report to dist directory
fs.writeFileSync(path.join(distDir, 'bundle-size.json'), JSON.stringify(report, null, 2));

console.log('\n✅ Size report saved to dist/bundle-size.json');
