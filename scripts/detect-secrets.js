const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

// Patterns to detect
const SECRET_PATTERNS = [
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'Private Key', regex: /-----BEGIN PRIVATE KEY-----/ },
    { name: 'Generic Secret', regex: /(api_key|apikey|secret|password|token)[a-zA-Z0-9_]*\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{8,}['"]/i },
    { name: 'JWT Token', regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/ }
];

// Files to ignore
const IGNORED_FILES = [
    'package-lock.json',
    'detect-secrets.js',
    'TESTING.md',
    '.env.example'
];

function getStagedFiles() {
    try {
        const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
        return output.split('\n').filter(file => file.trim() !== '' && !IGNORED_FILES.includes(path.basename(file)));
    } catch (error) {
        console.error(`${colors.yellow}Warning: Not a git repository or no staged files.${colors.reset}`);
        return [];
    }
}

function scanFile(filepath) {
    if (!fs.existsSync(filepath)) return [];

    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, index) => {
        SECRET_PATTERNS.forEach(pattern => {
            if (pattern.regex.test(line)) {
                // Ignore lines with "generic-secret-disable-line" comment
                if (!line.includes('generic-secret-disable-line')) {
                    issues.push({
                        line: index + 1,
                        type: pattern.name,
                        content: line.trim().substring(0, 50) + '...'
                    });
                }
            }
        });
    });

    return issues;
}

console.log(`${colors.green}🔍 Scanning staged files for secrets...${colors.reset}`);

const files = getStagedFiles();
let hasErrors = false;

if (files.length === 0) {
    console.log('No staged files to scan.');
    process.exit(0);
}

files.forEach(file => {
    const issues = scanFile(file);
    if (issues.length > 0) {
        hasErrors = true;
        console.error(`\n${colors.red}❌ Potential secret found in ${file}:${colors.reset}`);
        issues.forEach(issue => {
            console.error(`   Line ${issue.line} [${issue.type}]: ${issue.content}`);
        });
    }
});

if (hasErrors) {
    console.error(`\n${colors.red}🚫 Commit blocked! Secrets detected.${colors.reset}`);
    console.error(`If this is a false positive, add // generic-secret-disable-line to the end of the line.`);
    process.exit(1);
} else {
    console.log(`\n${colors.green}✅ No secrets found. Commit allowed.${colors.reset}`);
    process.exit(0);
}
