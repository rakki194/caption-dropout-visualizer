/**
 * Wolf Captions: Implementation for specialized caption separator handling
 * Inserts "., " after sentence endings while preserving abbreviations
 */

/**
 * Processes a caption to insert a comma after periods at the end of sentences
 * while preserving common abbreviations and decimal numbers.
 * 
 * @param caption The caption to process
 * @returns Processed caption with ".," after sentence endings
 */
export function processWolfCaption(caption: string): string {
  if (!caption || !caption.trim()) return '';
  
  // Common abbreviations to preserve
  const commonAbbreviations = [
    // Titles
    /Mr\./g, /Mrs\./g, /Ms\./g, /Dr\./g, /Prof\./g, /Rev\./g, /Hon\./g,
    // Common Latin abbreviations
    /etc\./g, /vs\./g, /e\.g\./g, /i\.e\./g, /et al\./g,
    // Time abbreviations
    /a\.m\./g, /p\.m\./g,
    // Geographical
    /U\.S\./g, /U\.K\./g, /U\.S\.A\./g, /N\.Y\./g,
    // Academic
    /Ph\.D\./g, /B\.A\./g, /M\.A\./g, /M\.S\./g, /B\.S\./g,
    // Other common abbreviations
    /k\.k\./g, /Inc\./g, /Ltd\./g, /Jr\./g, /Sr\./g, /St\./g
  ];
  
  // Mark abbreviations with unique placeholders
  let processedText = caption;
  const placeholders: Record<string, string> = {};
  
  // Replace abbreviations with placeholders
  commonAbbreviations.forEach((abbr, index) => {
    const placeholder = `__ABBR${index}__`;
    processedText = processedText.replace(abbr, (match) => {
      const uniqueId = placeholder + Math.random().toString(36).substring(2, 10);
      placeholders[uniqueId] = match;
      return uniqueId;
    });
  });
  
  // Mark decimal numbers
  const decimalPattern = /\d+\.\d+/g;
  processedText = processedText.replace(decimalPattern, (match) => {
    const uniqueId = `__NUM${Math.random().toString(36).substring(2, 10)}__`;
    placeholders[uniqueId] = match;
    return uniqueId;
  });
  
  // Replace periods at sentence boundaries with ".,", looking for:
  // 1. A period
  // 2. Not already followed by a comma
  // 3. Followed by whitespace and a capital letter OR end of string
  processedText = processedText.replace(/\.(?!,)(?=\s+[A-Z]|\s*$)/g, '.,');
  
  // Restore placeholders
  Object.entries(placeholders).forEach(([placeholder, original]) => {
    processedText = processedText.replace(new RegExp(placeholder, 'g'), original);
  });
  
  return processedText;
}

/**
 * Splits a caption into tokens using Wolf Caption rules
 * Similar to the standard tokenization but recognizes ".," as well as standard separators
 * 
 * @param caption The caption to tokenize
 * @param originalSeparators Original separators to use alongside Wolf Caption separators
 * @returns Array of tokens
 */
export function splitWolfCaption(caption: string, originalSeparators: string[] = [',']): string[] {
  if (!caption || !caption.trim()) return [];
  
  // Add ".," as a separator to the list of original separators
  const separators = [...originalSeparators];
  if (!separators.includes('.,')) {
    separators.push('.,');
  }
  
  // Apply each separator sequentially
  let tokens = [caption];
  for (const separator of separators) {
    const newTokens: string[] = [];
    for (const token of tokens) {
      newTokens.push(...token.split(separator));
    }
    tokens = newTokens;
  }
  
  // Clean up tokens
  return tokens.map(t => t.trim()).filter(t => t);
} 