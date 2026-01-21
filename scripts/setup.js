/**
 * Quest Mini - Setup Script
 * Initialize project dependencies and environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function warn(message) {
  log(`⚠ ${message}`, 'yellow');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'cyan');
}

function run(command, cwd = process.cwd()) {
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    return true;
  } catch (e) {
    return false;
  }
}

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function setup() {
  console.log('\n');
  log('╔══════════════════════════════════════════╗', 'cyan');
  log('║     Quest Mini - Project Setup           ║', 'cyan');
  log('╚══════════════════════════════════════════╝', 'cyan');
  console.log('\n');

  const rootDir = path.resolve(__dirname, '..');
  const contractsDir = path.join(rootDir, 'contracts');
  const functionDir = path.join(rootDir, 'function');

  // Check Node.js version
  info('Checking Node.js version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    error(`Node.js 16+ required. Current: ${nodeVersion}`);
    process.exit(1);
  }
  success(`Node.js ${nodeVersion}`);

  // Check npm
  info('Checking npm...');
  if (!checkCommand('npm')) {
    error('npm not found');
    process.exit(1);
  }
  success('npm found');

  // Check git
  info('Checking git...');
  if (!checkCommand('git')) {
    warn('git not found - version control features unavailable');
  } else {
    success('git found');
  }

  console.log('\n');
  log('Installing dependencies...', 'cyan');
  console.log('\n');

  // Install root dependencies
  if (fs.existsSync(path.join(rootDir, 'package.json'))) {
    info('Installing root dependencies...');
    if (run('npm install', rootDir)) {
      success('Root dependencies installed');
    } else {
      warn('Some root dependencies may have failed');
    }
  }

  // Install contracts dependencies
  if (fs.existsSync(path.join(contractsDir, 'package.json'))) {
    info('Installing contracts dependencies...');
    if (run('npm install', contractsDir)) {
      success('Contracts dependencies installed');
    } else {
      warn('Some contracts dependencies may have failed');
    }
  }

  // Install function dependencies
  if (fs.existsSync(path.join(functionDir, 'package.json'))) {
    info('Installing function dependencies...');
    if (run('npm install', functionDir)) {
      success('Function dependencies installed');
    } else {
      warn('Some function dependencies may have failed');
    }
  }

  console.log('\n');
  log('Setting up environment...', 'cyan');
  console.log('\n');

  // Create .env from .env.example if not exists
  const envFiles = [
    { example: path.join(contractsDir, '.env.example'), target: path.join(contractsDir, '.env') },
    { example: path.join(functionDir, '.env.example'), target: path.join(functionDir, '.env') }
  ];

  for (const { example, target } of envFiles) {
    if (fs.existsSync(example) && !fs.existsSync(target)) {
      fs.copyFileSync(example, target);
      success(`Created ${path.relative(rootDir, target)}`);
      warn(`Please update ${path.relative(rootDir, target)} with your values`);
    }
  }

  console.log('\n');
  log('Compiling contracts...', 'cyan');
  console.log('\n');

  // Compile contracts
  if (fs.existsSync(contractsDir)) {
    info('Compiling Solidity contracts...');
    if (run('npx hardhat compile', contractsDir)) {
      success('Contracts compiled successfully');
    } else {
      warn('Contract compilation had issues');
    }
  }

  console.log('\n');
  log('═══════════════════════════════════════════', 'cyan');
  log('            Setup Complete!                ', 'green');
  log('═══════════════════════════════════════════', 'cyan');
  console.log('\n');

  log('Next steps:', 'cyan');
  console.log('');
  log('1. Update .env files with your configuration', 'dim');
  log('2. Run tests: cd contracts && npm test', 'dim');
  log('3. Open app/index.html in a browser', 'dim');
  log('4. Connect your wallet and start questing!', 'dim');
  console.log('\n');

  log('Useful commands:', 'cyan');
  console.log('');
  log('  npm test          - Run tests', 'dim');
  log('  npm run compile   - Compile contracts', 'dim');
  log('  npm run deploy    - Deploy contracts', 'dim');
  log('  npm run verify    - Verify on BaseScan', 'dim');
  console.log('\n');
}

setup().catch(err => {
  error(`Setup failed: ${err.message}`);
  process.exit(1);
});
