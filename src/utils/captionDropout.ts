/**
 * Implements the caption dropout logic as found in sd-scripts
 */

import * as seedrandom from 'seedrandom';

/**
 * Splits a caption string using multiple separators
 * 
 * @param text The text to split
 * @param separators Array of separators to use
 * @returns Array of tokens
 */
export function splitByMultipleSeparators(text: string, separators: string[]): string[] {
  if (!separators || separators.length === 0) {
    // Default to comma if no separators provided
    return text.split(',').map(t => t.trim()).filter(t => t);
  }

  let tokens = [text];
  
  // Apply each separator sequentially
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

/**
 * Applies caption dropout to a given caption string
 * 
 * @param originalCaption The caption text to process
 * @param dropoutRate The probability of dropping out individual tags (0 to 1)
 * @param keepTokens Number of tokens to keep at beginning (won't be dropped)
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator or array of separators used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Processed caption after dropout
 */
export function applyCaptionDropout(
  originalCaption: string,
  dropoutRate: number,
  keepTokens: number = 0,
  keepTokensSeparator: string = '',
  captionSeparator: string | string[] = ',',
  seed?: number
): string {
  // Handle empty captions
  if (!originalCaption || !originalCaption.trim()) return '';
  
  // Setup RNG with seed if provided
  const rng = seed !== undefined ? seedrandom(seed.toString()) : Math.random;
  
  // Determine primary separator and process caption
  const primarySeparator = Array.isArray(captionSeparator) ? 
    (captionSeparator.length > 0 ? captionSeparator[0] : ',') : 
    captionSeparator;
  
  // Split caption into tokens based on separator(s)
  const tokens = Array.isArray(captionSeparator) ?
    splitByMultipleSeparators(originalCaption, captionSeparator) :
    originalCaption.split(captionSeparator).map(t => t.trim()).filter(t => t);
  
  if (tokens.length === 0) return '';
  
  // Handle keep tokens
  let tokensToKeep: string[] = [];
  if (keepTokens > 0 && keepTokensSeparator) {
    // Escape special regex characters in the keepTokensSeparator
    const escapedSeparator = keepTokensSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keepTokensRegex = new RegExp(`${escapedSeparator}([^${escapedSeparator}]+)${escapedSeparator}`, 'g');
    let match;
    while ((match = keepTokensRegex.exec(originalCaption)) !== null) {
      if (match[1]) tokensToKeep.push(match[1].trim());
    }
  }
  
  // Apply dropout to each token
  const newTokens = tokens.filter(token => {
    // Always keep tokens marked for preservation
    if (tokensToKeep.some(keepToken => token.includes(keepToken))) {
      return true;
    }
    // Apply random dropout
    return rng() > dropoutRate;
  });
  
  // Return the new caption
  return newTokens.join(primarySeparator);
}

/**
 * Shuffles a given caption string
 * 
 * @param originalCaption The caption text to shuffle
 * @param keepTokens Number of tokens to keep at beginning (won't be shuffled)
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator or array of separators used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Shuffled caption
 */
export function shuffleCaption(
  originalCaption: string,
  keepTokens: number = 0,
  keepTokensSeparator: string = '',
  captionSeparator: string | string[] = ',',
  seed?: number
): string {
  // Handle empty captions
  if (!originalCaption || !originalCaption.trim()) return '';
  
  // Setup RNG with seed if provided
  const rng = seed !== undefined ? seedrandom(seed.toString()) : Math.random;
  
  // Determine primary separator and process caption
  const primarySeparator = Array.isArray(captionSeparator) ? 
    (captionSeparator.length > 0 ? captionSeparator[0] : ',') : 
    captionSeparator;
  
  // Split caption into tokens based on separator(s)
  const tokens = Array.isArray(captionSeparator) ?
    splitByMultipleSeparators(originalCaption, captionSeparator) :
    originalCaption.split(captionSeparator).map(t => t.trim()).filter(t => t);
  
  if (tokens.length === 0) return '';
  
  // Handle keep tokens
  let tokensToKeep: { token: string; index: number }[] = [];
  if (keepTokens > 0 && keepTokensSeparator) {
    // Escape special regex characters in the keepTokensSeparator
    const escapedSeparator = keepTokensSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keepTokensRegex = new RegExp(`${escapedSeparator}([^${escapedSeparator}]+)${escapedSeparator}`, 'g');
    let match;
    while ((match = keepTokensRegex.exec(originalCaption)) !== null) {
      if (match[1]) {
        const keepToken = match[1].trim();
        for (let i = 0; i < tokens.length; i++) {
          if (tokens[i].includes(keepToken)) {
            tokensToKeep.push({ token: tokens[i], index: i });
            break;
          }
        }
      }
    }
  }
  
  // Save the tokens that need to stay in their positions
  const keepPositions = tokensToKeep.map(item => item.index);
  const tokensToShuffle = tokens.filter((_, index) => !keepPositions.includes(index));
  
  // Shuffle the remaining tokens
  for (let i = tokensToShuffle.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tokensToShuffle[i], tokensToShuffle[j]] = [tokensToShuffle[j], tokensToShuffle[i]];
  }
  
  // Reconstruct the caption, keeping specific tokens in their original positions
  const newTokens = [...tokens];
  let shuffleIndex = 0;
  
  for (let i = 0; i < newTokens.length; i++) {
    if (!keepPositions.includes(i)) {
      newTokens[i] = tokensToShuffle[shuffleIndex++];
    }
  }
  
  // Return the new caption
  return newTokens.join(primarySeparator);
}

/**
 * Applies both dropout and shuffle to a caption
 * 
 * @param originalCaption The caption text to process
 * @param dropoutRate The probability of dropping out individual tags (0 to 1)
 * @param keepTokens Number of tokens to keep at beginning (won't be dropped or shuffled)
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator or array of separators used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Processed caption after both dropout and shuffle
 */
export function applyBothDropoutAndShuffle(
  originalCaption: string,
  dropoutRate: number,
  keepTokens: number = 0,
  keepTokensSeparator: string = '',
  captionSeparator: string | string[] = ',',
  seed?: number
): string {
  // First apply dropout
  const droppedCaption = applyCaptionDropout(
    originalCaption, 
    dropoutRate, 
    keepTokens, 
    keepTokensSeparator, 
    captionSeparator, 
    seed
  );
  
  // Then shuffle what remains
  return shuffleCaption(
    droppedCaption, 
    keepTokens, 
    keepTokensSeparator, 
    captionSeparator, 
    seed
  );
}

/**
 * Simulates caption dropout steps for visualization
 * 
 * @param originalCaption The original caption
 * @param dropoutRate The dropout rate to apply
 * @param steps How many simulated steps to run
 * @param keepTokens Number of tokens to keep at beginning
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator or array of separators used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Array of resulting captions after each step
 */
export function simulateDropoutSteps(
  originalCaption: string,
  dropoutRate: number,
  steps: number,
  keepTokens: number = 0,
  keepTokensSeparator: string = '',
  captionSeparator: string | string[] = ',',
  seed?: number
): string[] {
  const results: string[] = [];
  
  // Generate a different seed for each step if an initial seed is provided
  const baseSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
  
  // Limit to a safer number of steps to prevent UI hangs (set a high cap, e.g., 1000)
  const safeStepCount = Math.min(steps, 1000);
  
  for (let i = 0; i < safeStepCount; i++) {
    // Use a deterministic but unique seed for each step
    const stepSeed = seed !== undefined ? baseSeed + i : undefined;
    
    results.push(applyCaptionDropout(
      originalCaption, 
      dropoutRate, 
      keepTokens, 
      keepTokensSeparator, 
      captionSeparator, 
      stepSeed
    ));
  }
  
  return results;
}

/**
 * Simulates caption shuffle steps for visualization
 * 
 * @param originalCaption The original caption
 * @param steps How many simulated steps to run
 * @param keepTokens Number of tokens to keep at beginning
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator or array of separators used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Array of resulting shuffled captions after each step
 */
export function simulateShuffleSteps(
  originalCaption: string,
  steps: number,
  keepTokens: number = 0,
  keepTokensSeparator: string = '',
  captionSeparator: string | string[] = ',',
  seed?: number
): string[] {
  const results: string[] = [];
  
  // Generate a different seed for each step if an initial seed is provided
  const baseSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
  
  // Limit to a safer number of steps to prevent UI hangs (set a high cap, e.g., 1000)
  const safeStepCount = Math.min(steps, 1000);
  
  for (let i = 0; i < safeStepCount; i++) {
    // Use a deterministic but unique seed for each step
    const stepSeed = seed !== undefined ? baseSeed + i : undefined;
    
    results.push(shuffleCaption(
      originalCaption, 
      keepTokens, 
      keepTokensSeparator, 
      captionSeparator, 
      stepSeed
    ));
  }
  
  return results;
}

/**
 * Simulates combined dropout and shuffle steps for visualization
 * 
 * @param originalCaption The original caption
 * @param dropoutRate The dropout rate to apply
 * @param steps How many simulated steps to run
 * @param keepTokens Number of tokens to keep at beginning
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator or array of separators used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Array of resulting captions after each step with both operations applied
 */
export function simulateBothOperationsSteps(
  originalCaption: string,
  dropoutRate: number,
  steps: number,
  keepTokens: number = 0,
  keepTokensSeparator: string = '',
  captionSeparator: string | string[] = ',',
  seed?: number
): string[] {
  const results: string[] = [];
  
  // Generate a different seed for each step if an initial seed is provided
  const baseSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
  
  // Limit to a safer number of steps to prevent UI hangs (set a high cap, e.g., 1000)
  const safeStepCount = Math.min(steps, 1000);
  
  for (let i = 0; i < safeStepCount; i++) {
    // Use a deterministic but unique seed for each step
    const stepSeed = seed !== undefined ? baseSeed + i : undefined;
    
    results.push(applyBothDropoutAndShuffle(
      originalCaption, 
      dropoutRate, 
      keepTokens, 
      keepTokensSeparator, 
      captionSeparator, 
      stepSeed
    ));
  }
  
  return results;
} 