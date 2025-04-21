/**
 * Test script for Wolf Captions
 * Run with: ts-node test-wolf-captions.ts
 */

import { processWolfCaption, splitWolfCaption } from './wolfCaptions';

// Test cases
const testCases = [
  // Basic sentence ending
  {
    name: "Basic sentence",
    input: "This is a test. This is another sentence.",
    expected: "This is a test., This is another sentence.,"
  },
  // Abbreviations
  {
    name: "Common abbreviations",
    input: "Dr. Smith and Mr. Jones visited the U.S.A. They arrived at 5 p.m. and left at 10 a.m.",
    expected: "Dr. Smith and Mr. Jones visited the U.S.A., They arrived at 5 p.m. and left at 10 a.m.,"
  },
  // Decimal numbers
  {
    name: "Decimal numbers",
    input: "The height is 5.5 feet. The price is $10.99.",
    expected: "The height is 5.5 feet., The price is $10.99.,"
  },
  // Academic abbreviations
  {
    name: "Academic abbreviations",
    input: "She has a Ph.D. in Computer Science. He has a B.A. in English.",
    expected: "She has a Ph.D. in Computer Science., He has a B.A. in English.,"
  },
  // Complex case
  {
    name: "Complex case with multiple abbreviations",
    input: "Prof. Johnson works at Inc. as a consultant. The company is located in the U.S.A. near N.Y. It's around 5.5 miles from Dr. Smith's office. Meeting at 3 p.m. sharp.",
    expected: "Prof. Johnson works at Inc. as a consultant., The company is located in the U.S.A. near N.Y., It's around 5.5 miles from Dr. Smith's office., Meeting at 3 p.m. sharp.,"
  },
  // Caption-like text
  {
    name: "Caption-like text",
    input: "furry, male focus, blue eyes, solo, digital painting, outdoor setting. the character is standing in a forest. the sun is shining through the trees.",
    expected: "furry, male focus, blue eyes, solo, digital painting, outdoor setting., the character is standing in a forest., the sun is shining through the trees.,"
  },
  // Multiple sentences with tags
  {
    name: "Multiple sentences with tags",
    input: "character ||| This is a character description. He has blue eyes. He is wearing a hat.",
    expected: "character ||| This is a character description., He has blue eyes., He is wearing a hat.,"
  }
];

// Run the tests
console.log("Testing Wolf Captions implementation\n");

let passedTests = 0;
for (const testCase of testCases) {
  console.log(`Test: ${testCase.name}`);
  console.log(`Input: ${testCase.input}`);
  
  const result = processWolfCaption(testCase.input);
  console.log(`Result: ${result}`);
  console.log(`Expected: ${testCase.expected}`);
  
  const passed = result === testCase.expected;
  console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (passed) {
    passedTests++;
  } else {
    console.log("Differences:");
    for (let i = 0; i < Math.max(result.length, testCase.expected.length); i++) {
      if (result[i] !== testCase.expected[i]) {
        console.log(`  At position ${i}: Expected "${testCase.expected[i] || ''}" but got "${result[i] || ''}"`);
      }
    }
  }
  console.log("\n" + "-".repeat(60) + "\n");
}

// Test tokenization
console.log("Testing Wolf Caption Tokenization\n");

const tokenizationTests = [
  {
    name: "Standard tokenization",
    input: "furry, male focus, blue eyes, solo, digital painting",
    separators: [','],
    expected: ["furry", "male focus", "blue eyes", "solo", "digital painting"]
  },
  {
    name: "Wolf Caption tokenization",
    input: "This is a test., This is another sentence.,",
    separators: [','],
    expected: ["This is a test.", "This is another sentence", ""]
  },
  {
    name: "Mixed separators",
    input: "character ||| This is a description., It has multiple parts., It uses tags.",
    separators: ['|||', ','],
    expected: ["character", "This is a description.", "It has multiple parts.", "It uses tags", ""]
  }
];

for (const test of tokenizationTests) {
  console.log(`Test: ${test.name}`);
  console.log(`Input: ${test.input}`);
  
  const tokens = splitWolfCaption(test.input, test.separators);
  console.log(`Tokens: ${JSON.stringify(tokens)}`);
  console.log(`Expected: ${JSON.stringify(test.expected)}`);
  
  const passed = JSON.stringify(tokens) === JSON.stringify(test.expected);
  console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log("\n" + "-".repeat(60) + "\n");
  
  if (passed) {
    passedTests++;
  }
}

// Summary
console.log(`Test Summary: ${passedTests} out of ${testCases.length + tokenizationTests.length} tests passed`);
if (passedTests === testCases.length + tokenizationTests.length) {
  console.log("All tests passed! 🎉");
} else {
  console.log("Some tests failed. Please review the output above.");
} 