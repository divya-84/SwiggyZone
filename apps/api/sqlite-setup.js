const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = path.join(__dirname, '..', '..');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const backupPath = schemaPath + '.backup';

console.log('--- SwiggyZone SQLite Migration Script ---');

// 1. Backup original schema
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(schemaPath, backupPath);
  console.log('✔ Backed up original PostgreSQL schema to schema.prisma.backup');
}

let schema = fs.readFileSync(backupPath, 'utf8');

// 2. Parse enums
const enums = {};
const enumRegex = /enum\s+(\w+)\s*\{([\s\S]*?)\}/g;
let match;
while ((match = enumRegex.exec(schema)) !== null) {
  const name = match[1];
  const valuesStr = match[2];
  const values = valuesStr
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('//'))
    .map(val => val.split(/\s+/)[0]); // Get the enum value (ignore comments/annotations on the same line)
  enums[name] = values;
}

console.log('✔ Found enums to emulate:', Object.keys(enums));

// 3. Remove enum definitions from schema
schema = schema.replace(/enum\s+\w+\s*\{[\s\S]*?\}/g, '');

// 4. Replace provider and URL
schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/g, 'url = "file:./dev.db"');

// 5. Replace enum usages in models
for (const enumName of Object.keys(enums)) {
  // roleName UserRoleName @default(CUSTOMER) -> roleName String @default("CUSTOMER")
  const defaultValRegex = new RegExp(`(\\b\\w+\\s+)${enumName}(\\s+@default\\()(\\w+)(\\))`, 'g');
  schema = schema.replace(defaultValRegex, `$1String$2"$3"$4`);

  // roleName UserRoleName -> roleName String
  const typeRegex = new RegExp(`(\\b\\w+\\s+)${enumName}(\\b)`, 'g');
  schema = schema.replace(typeRegex, `$1String$2`);
  
  // roleName UserRoleName[] -> roleName String[]
  const arrayTypeRegex = new RegExp(`(\\b\\w+\\s+)${enumName}(\\[\\])`, 'g');
  schema = schema.replace(arrayTypeRegex, `$1String$2`);
}

// Write the SQLite schema
fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('✔ Converted schema.prisma to SQLite format');

// Delete existing SQLite DB if it exists for a fresh seed
const dbFile = path.join(__dirname, 'prisma', 'dev.db');
const dbJournal = path.join(__dirname, 'prisma', 'dev.db-journal');
if (fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
  console.log('✔ Cleaned up existing dev.db for a fresh seed');
}
if (fs.existsSync(dbJournal)) {
  fs.unlinkSync(dbJournal);
}

// 6. Push schema to local SQLite database (this runs prisma generate automatically)
console.log('Running prisma db push...');
try {
  execSync('npx prisma db push --schema=apps/api/prisma/schema.prisma', {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./dev.db' }
  });
  console.log('✔ Local SQLite database (dev.db) initialized successfully');
} catch (err) {
  console.error('❌ Failed running prisma db push:', err.message);
  process.exit(1);
}

// 7. Inject enums into generated client
console.log('Injecting TypeScript enums into Prisma Client...');

// We need to write enums to both .js and .d.ts files of the client
let jsEnums = '\n// Injected SQLite Enums\n';
let tsEnums = '\n// Injected SQLite Enums\n';

for (const [enumName, values] of Object.entries(enums)) {
  jsEnums += `exports.${enumName} = {\n`;
  tsEnums += `export const ${enumName}: {\n`;
  for (const val of values) {
    jsEnums += `  ${val}: '${val}',\n`;
    tsEnums += `  ${val}: '${val}';\n`;
  }
  jsEnums += `};\n`;
  tsEnums += `};\nexport type ${enumName} = (typeof ${enumName})[keyof typeof ${enumName}];\n`;
}

const clientDirs = [
  path.join(workspaceRoot, 'node_modules', '@prisma', 'client'),
  path.join(workspaceRoot, 'node_modules', '.prisma', 'client'),
  path.join(workspaceRoot, 'apps', 'api', 'node_modules', '@prisma', 'client'),
  path.join(workspaceRoot, 'apps', 'api', 'node_modules', '.prisma', 'client'),
  path.join(workspaceRoot, 'apps', 'web', 'node_modules', '@prisma', 'client'),
  path.join(workspaceRoot, 'apps', 'web', 'node_modules', '.prisma', 'client'),
].filter(d => fs.existsSync(d));

console.log(`Found ${clientDirs.length} Prisma Client directories:`, clientDirs.map(d => path.relative(workspaceRoot, d)));

let filesWritten = 0;

for (const clientDir of clientDirs) {
  const targetJsFiles = [
    path.join(clientDir, 'index.js'),
    path.join(clientDir, 'default.js'),
    path.join(clientDir, 'index.browser.js')
  ];

  const targetTsFiles = [
    path.join(clientDir, 'index.d.ts')
  ];

  for (const jsFile of targetJsFiles) {
    if (fs.existsSync(jsFile)) {
      let content = fs.readFileSync(jsFile, 'utf8');
      if (!content.includes('// Injected SQLite Enums')) {
        content += jsEnums;
        fs.writeFileSync(jsFile, content, 'utf8');
        console.log(`  - Appended JS enums to: ${path.relative(workspaceRoot, jsFile)}`);
        filesWritten++;
      }
    }
  }

  for (const tsFile of targetTsFiles) {
    if (fs.existsSync(tsFile)) {
      let content = fs.readFileSync(tsFile, 'utf8');
      if (!content.includes('// Injected SQLite Enums')) {
        content += tsEnums;
        fs.writeFileSync(tsFile, content, 'utf8');
        console.log(`  - Appended TS enums to: ${path.relative(workspaceRoot, tsFile)}`);
        filesWritten++;
      }
    }
  }
}

console.log(`✔ Injected enums into ${filesWritten} files`);

// 8. Seed the SQLite database
console.log('Seeding the local SQLite database...');
try {
  execSync('npx ts-node apps/api/prisma/seed.ts', {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./dev.db' }
  });
  console.log('✔ Database seeded successfully!');
} catch (err) {
  console.error('❌ Database seeding failed:', err.message);
  process.exit(1);
}

console.log('✔ Local database and client setup complete!');
