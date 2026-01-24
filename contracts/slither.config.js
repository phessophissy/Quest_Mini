/**
 * Slither Security Analysis Configuration
 * Static analyzer for Solidity smart contracts
 */
module.exports = {
  // Files to analyze
  filter_paths: [
    'contracts/'
  ],
  
  // Exclude test files and mocks
  exclude_paths: [
    'test/',
    'node_modules/',
    'contracts/mocks/'
  ],

  // Detectors to run
  detectors: {
    // High severity - always enabled
    'reentrancy-eth': true,
    'reentrancy-no-eth': true,
    'arbitrary-send': true,
    'controlled-delegatecall': true,
    'unchecked-transfer': true,
    'locked-ether': true,
    'suicidal': true,
    
    // Medium severity
    'unprotected-upgrade': true,
    'uninitialized-state': true,
    'tx-origin': true,
    'unused-return': true,
    'weak-prng': true,
    'shadowing-state': true,
    
    // Low severity - informational
    'naming-convention': true,
    'pragma': true,
    'solc-version': true,
    'dead-code': true,
    'unused-state': true,
    'constable-states': true,
    'external-function': true
  },

  // Reporting format
  output: {
    format: 'json',
    filename: 'slither-report.json'
  },

  // Compilation settings
  compile: {
    solc_version: '0.8.20',
    optimization: true,
    optimization_runs: 200
  }
};
