/**
 * Implements the caption dropout logic as found in sd-scripts
 */

import * as seedrandom from 'seedrandom';

/**
 * Applies caption dropout to a given caption string
 * 
 * @param originalCaption The caption text to process
 * @param dropoutRate The probability of dropping out individual tags (0 to 1)
 * @param keepTokens Number of tokens to keep at beginning (won't be dropped)
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Processed caption after dropout
 */
export function applyCaptionDropout(
  originalCaption: string,
  dropoutRate: number,
  keepTokens: number = 1,
  keepTokensSeparator: string = '|||',
  captionSeparator: string = ',',
  seed?: number
): string {
  // Trim whitespace
  const trimmedCaption = originalCaption.trim();

  // Split by the keep tokens separator if present
  let fixedPart = '';
  let flexPart = trimmedCaption;
  let fixedSuffixPart = '';

  if (keepTokensSeparator && trimmedCaption.includes(keepTokensSeparator)) {
    const parts = trimmedCaption.split(keepTokensSeparator);
    
    if (parts.length >= 2) {
      fixedPart = parts[0];
      flexPart = parts[1];
      
      // Check if there's a second separator for suffix
      if (parts.length > 2) {
        fixedSuffixPart = parts.slice(2).join(keepTokensSeparator);
      }
    }
  } else {
    // Use the keepTokens parameter if no separator
    const tokens = trimmedCaption.split(captionSeparator);
    fixedPart = tokens.slice(0, keepTokens).join(captionSeparator);
    flexPart = tokens.slice(keepTokens).join(captionSeparator);
  }

  // Split into tokens
  const fixedTokens = fixedPart.split(captionSeparator).map(t => t.trim()).filter(t => t);
  const flexTokens = flexPart.split(captionSeparator).map(t => t.trim()).filter(t => t);
  const fixedSuffixTokens = fixedSuffixPart.split(captionSeparator).map(t => t.trim()).filter(t => t);

  // Apply dropout to flexible tokens
  const rng = seed !== undefined ? seedrandom(String(seed)) : Math.random;
  const tokensAfterDropout = flexTokens.filter(() => rng() > dropoutRate);

  // Join the tokens back together
  return [...fixedTokens, ...tokensAfterDropout, ...fixedSuffixTokens].join(captionSeparator + ' ');
}

/**
 * Shuffles a given caption string
 * 
 * @param originalCaption The caption text to shuffle
 * @param keepTokens Number of tokens to keep at beginning (won't be shuffled)
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Shuffled caption
 */
export function shuffleCaption(
  originalCaption: string,
  keepTokens: number = 1,
  keepTokensSeparator: string = '|||',
  captionSeparator: string = ',',
  seed?: number
): string {
  // Trim whitespace
  const trimmedCaption = originalCaption.trim();

  // Split by the keep tokens separator if present
  let fixedPart = '';
  let flexPart = trimmedCaption;
  let fixedSuffixPart = '';

  if (keepTokensSeparator && trimmedCaption.includes(keepTokensSeparator)) {
    const parts = trimmedCaption.split(keepTokensSeparator);
    
    if (parts.length >= 2) {
      fixedPart = parts[0];
      flexPart = parts[1];
      
      // Check if there's a second separator for suffix
      if (parts.length > 2) {
        fixedSuffixPart = parts.slice(2).join(keepTokensSeparator);
      }
    }
  } else {
    // Use the keepTokens parameter if no separator
    const tokens = trimmedCaption.split(captionSeparator);
    fixedPart = tokens.slice(0, keepTokens).join(captionSeparator);
    flexPart = tokens.slice(keepTokens).join(captionSeparator);
  }

  // Split into tokens
  const fixedTokens = fixedPart.split(captionSeparator).map(t => t.trim()).filter(t => t);
  const flexTokens = flexPart.split(captionSeparator).map(t => t.trim()).filter(t => t);
  const fixedSuffixTokens = fixedSuffixPart.split(captionSeparator).map(t => t.trim()).filter(t => t);

  // Shuffle flexible tokens with seed if provided (matches sd-scripts implementation)
  const shuffledTokens = [...flexTokens];
  
  // Use seeded RNG if seed is provided (Fisher-Yates shuffle algorithm)
  const rng = seed !== undefined ? seedrandom(String(seed)) : Math.random;
  
  for (let i = shuffledTokens.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledTokens[i], shuffledTokens[j]] = [shuffledTokens[j], shuffledTokens[i]];
  }

  // Join the tokens back together
  return [...fixedTokens, ...shuffledTokens, ...fixedSuffixTokens].join(captionSeparator + ' ');
}

/**
 * Applies both dropout and shuffle to a caption
 * 
 * @param originalCaption The caption text to process
 * @param dropoutRate The probability of dropping out individual tags (0 to 1)
 * @param keepTokens Number of tokens to keep at beginning (won't be dropped or shuffled)
 * @param keepTokensSeparator Separator for keep tokens sections
 * @param captionSeparator Separator used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Processed caption after both dropout and shuffle
 */
export function applyBothDropoutAndShuffle(
  originalCaption: string,
  dropoutRate: number,
  keepTokens: number = 1,
  keepTokensSeparator: string = '|||',
  captionSeparator: string = ',',
  seed?: number
): string {
  // Create two seed values from the original seed
  let dropoutSeed, shuffleSeed;
  if (seed !== undefined) {
    const rng = seedrandom(String(seed));
    dropoutSeed = Math.floor(rng() * 1_000_000_000);
    shuffleSeed = Math.floor(rng() * 1_000_000_000);
  }
  
  // First apply dropout, then shuffle the result
  const captionAfterDropout = applyCaptionDropout(
    originalCaption,
    dropoutRate,
    keepTokens,
    keepTokensSeparator,
    captionSeparator,
    dropoutSeed
  );
  
  return shuffleCaption(
    captionAfterDropout,
    keepTokens,
    keepTokensSeparator,
    captionSeparator,
    shuffleSeed
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
 * @param captionSeparator Separator used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Array of resulting captions after each step
 */
export function simulateDropoutSteps(
  originalCaption: string,
  dropoutRate: number,
  steps: number = 1500,
  keepTokens: number = 1,
  keepTokensSeparator: string = '|||',
  captionSeparator: string = ',',
  seed?: number
): string[] {
  const results: string[] = [];
  
  // Create seeded RNG
  const mainRng = seed !== undefined ? seedrandom(String(seed)) : Math.random;
  
  // Generate a new seed for each step derived from the main seed
  for (let step = 0; step < steps; step++) {
    // If seed is provided, create deterministic seeds for each step
    const stepSeed = seed !== undefined ? 
      Math.floor(mainRng() * 1_000_000_000) : 
      undefined;
    
    results.push(
      applyCaptionDropout(
        originalCaption,
        dropoutRate,
        keepTokens,
        keepTokensSeparator,
        captionSeparator,
        stepSeed
      )
    );
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
 * @param captionSeparator Separator used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Array of resulting shuffled captions after each step
 */
export function simulateShuffleSteps(
  originalCaption: string,
  steps: number = 1500,
  keepTokens: number = 1,
  keepTokensSeparator: string = '|||',
  captionSeparator: string = ',',
  seed?: number
): string[] {
  const results: string[] = [];
  
  // Create seeded RNG
  const mainRng = seed !== undefined ? seedrandom(String(seed)) : Math.random;
  
  // Generate a new seed for each step derived from the main seed
  for (let step = 0; step < steps; step++) {
    // If seed is provided, create deterministic seeds for each step
    const stepSeed = seed !== undefined ? 
      Math.floor(mainRng() * 1_000_000_000) : 
      undefined;
    
    results.push(
      shuffleCaption(
        originalCaption,
        keepTokens,
        keepTokensSeparator,
        captionSeparator,
        stepSeed
      )
    );
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
 * @param captionSeparator Separator used between caption tokens
 * @param seed Optional seed for deterministic results
 * @returns Array of resulting captions after each step with both operations applied
 */
export function simulateBothOperationsSteps(
  originalCaption: string,
  dropoutRate: number,
  steps: number = 1500,
  keepTokens: number = 1,
  keepTokensSeparator: string = '|||',
  captionSeparator: string = ',',
  seed?: number
): string[] {
  const results: string[] = [];
  
  // Create seeded RNG
  const mainRng = seed !== undefined ? seedrandom(String(seed)) : Math.random;
  
  // Generate a new seed for each step derived from the main seed
  for (let step = 0; step < steps; step++) {
    // If seed is provided, create deterministic seeds for each step
    const stepSeed = seed !== undefined ? 
      Math.floor(mainRng() * 1_000_000_000) : 
      undefined;
    
    results.push(
      applyBothDropoutAndShuffle(
        originalCaption,
        dropoutRate,
        keepTokens,
        keepTokensSeparator,
        captionSeparator,
        stepSeed
      )
    );
  }
  
  return results;
} 